#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, '_TEMP_ONLY');
const outJson = path.join(outDir, 'babel-viability-report.json');
const outCsv = path.join(outDir, 'babel-viability-report.csv');
const outFailJson = path.join(outDir, 'babel-viability-failures.json');
const outFailCsv = path.join(outDir, 'babel-viability-failures.csv');

const ignoreDirs = new Set([
  '.git',
  'node_modules',
  '_chat_conversations',
  '_TEMP_ONLY',
  'img',
  'songs'
]);

const parserPlugins = [
  'jsx',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  'objectRestSpread',
  'optionalChaining',
  'nullishCoalescingOperator',
  'dynamicImport',
  'topLevelAwait'
];

const generatedPathFragments = [
  path.join('bin', 'namespacer', 'data', 'out')
];

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function calculateSeverity(result) {
  const parsePenalty = result.ok ? 0 : 1000;
  const jqueryWeight = result.jqueryCount * 2;
  const browserWeight = result.browserGlobalCount * 3;
  const sizeWeight = Math.ceil(result.bodyNodeCount / 20);
  return parsePenalty + jqueryWeight + browserWeight + sizeWeight;
}

function parseArgs(argv) {
  const args = {
    root: repoRoot,
    outJson,
    outCsv,
    outFailJson,
    outFailCsv,
    includeSongs: false,
    includeImg: false,
    includeGenerated: false,
    customOutPaths: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--root' && argv[i + 1]) {
      args.root = path.resolve(argv[i + 1]);
      i += 1;
    } else if (token === '--out-json' && argv[i + 1]) {
      args.outJson = path.resolve(argv[i + 1]);
      args.customOutPaths = true;
      i += 1;
    } else if (token === '--out-csv' && argv[i + 1]) {
      args.outCsv = path.resolve(argv[i + 1]);
      args.customOutPaths = true;
      i += 1;
    } else if (token === '--out-fail-json' && argv[i + 1]) {
      args.outFailJson = path.resolve(argv[i + 1]);
      args.customOutPaths = true;
      i += 1;
    } else if (token === '--out-fail-csv' && argv[i + 1]) {
      args.outFailCsv = path.resolve(argv[i + 1]);
      args.customOutPaths = true;
      i += 1;
    } else if (token === '--include-songs') {
      args.includeSongs = true;
    } else if (token === '--include-img') {
      args.includeImg = true;
    } else if (token === '--include-generated') {
      args.includeGenerated = true;
    }
  }

  return args;
}

function shouldSkipDir(name, includeSongs, includeImg) {
  if (name === 'songs' && includeSongs) return false;
  if (name === 'img' && includeImg) return false;
  return ignoreDirs.has(name);
}

function shouldSkipByPath(absPath, root, includeGenerated) {
  if (includeGenerated) return false;
  const relPosix = toPosixPath(path.relative(root, absPath));
  return generatedPathFragments.some((fragment) => {
    const fragmentPosix = toPosixPath(fragment);
    return relPosix === fragmentPosix || relPosix.startsWith(fragmentPosix + '/');
  });
}

function walkJsFiles(startDir, includeSongs, includeImg, includeGenerated) {
  const found = [];

  function visit(dir) {
    if (shouldSkipByPath(dir, startDir, includeGenerated)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (shouldSkipDir(entry.name, includeSongs, includeImg)) continue;
        if (shouldSkipByPath(abs, startDir, includeGenerated)) continue;
        visit(abs);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        found.push(abs);
      }
    }
  }

  visit(startDir);
  return found;
}

function parseOne(filePath, rootDir) {
  const code = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(rootDir, filePath);
  const jqueryCount = (code.match(/\$\s*\(/g) || []).length;
  const browserGlobalCount = (code.match(/\b(window|document|localStorage|sessionStorage|navigator)\b/g) || []).length;

  try {
    const ast = babel.parseSync(code, {
      filename: relPath,
      sourceType: 'unambiguous',
      parserOpts: {
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true,
        allowSuperOutsideMethod: true,
        plugins: parserPlugins
      }
    });

    const result = {
      file: relPath,
      ok: true,
      bodyNodeCount: ast && ast.program ? ast.program.body.length : 0,
      jqueryCount,
      browserGlobalCount,
      error: ''
    };
    result.severityScore = calculateSeverity(result);
    return result;
  } catch (err) {
    const result = {
      file: relPath,
      ok: false,
      bodyNodeCount: 0,
      jqueryCount,
      browserGlobalCount,
      error: err && err.message ? err.message : String(err)
    };
    result.severityScore = calculateSeverity(result);
    return result;
  }
}

function csvEscape(value) {
  const str = String(value);
  if (/[,"\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(results) {
  const header = ['file', 'ok', 'severityScore', 'bodyNodeCount', 'jqueryCount', 'browserGlobalCount', 'error'];
  const lines = [header.join(',')];
  for (const row of results) {
    lines.push([
      csvEscape(row.file),
      csvEscape(row.ok),
      csvEscape(row.severityScore),
      csvEscape(row.bodyNodeCount),
      csvEscape(row.jqueryCount),
      csvEscape(row.browserGlobalCount),
      csvEscape(row.error)
    ].join(','));
  }
  return lines.join('\n') + '\n';
}

function writeReports(results, outJsonPath, outCsvPath, outFailJsonPath, outFailCsvPath) {
  fs.mkdirSync(path.dirname(outJsonPath), { recursive: true });
  fs.mkdirSync(path.dirname(outCsvPath), { recursive: true });
  fs.mkdirSync(path.dirname(outFailJsonPath), { recursive: true });
  fs.mkdirSync(path.dirname(outFailCsvPath), { recursive: true });

  const sortedResults = [...results].sort((a, b) => b.severityScore - a.severityScore);
  const failures = sortedResults.filter((x) => !x.ok);

  const summary = {
    generatedAt: new Date().toISOString(),
    total: sortedResults.length,
    pass: sortedResults.filter((x) => x.ok).length,
    fail: failures.length,
    files: sortedResults
  };

  const failureSummary = {
    generatedAt: summary.generatedAt,
    totalFailures: failures.length,
    files: failures
  };

  fs.writeFileSync(outJsonPath, JSON.stringify(summary, null, 2), 'utf8');
  fs.writeFileSync(outCsvPath, toCsv(sortedResults), 'utf8');
  fs.writeFileSync(outFailJsonPath, JSON.stringify(failureSummary, null, 2), 'utf8');
  fs.writeFileSync(outFailCsvPath, toCsv(failures), 'utf8');

  return { summary, failureSummary };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.includeGenerated && !args.customOutPaths) {
    args.outJson = path.join(outDir, 'babel-viability-report-all.json');
    args.outCsv = path.join(outDir, 'babel-viability-report-all.csv');
    args.outFailJson = path.join(outDir, 'babel-viability-failures-all.json');
    args.outFailCsv = path.join(outDir, 'babel-viability-failures-all.csv');
  }
  const files = walkJsFiles(args.root, args.includeSongs, args.includeImg, args.includeGenerated).sort();
  const results = files.map((filePath) => parseOne(filePath, args.root));
  const { summary, failureSummary } = writeReports(
    results,
    args.outJson,
    args.outCsv,
    args.outFailJson,
    args.outFailCsv
  );

  const topJquery = [...results]
    .sort((a, b) => b.jqueryCount - a.jqueryCount)
    .slice(0, 5)
    .map((x) => `${x.file} (${x.jqueryCount})`);

  const topBrowser = [...results]
    .sort((a, b) => b.browserGlobalCount - a.browserGlobalCount)
    .slice(0, 5)
    .map((x) => `${x.file} (${x.browserGlobalCount})`);

  const topSeverity = [...results]
    .sort((a, b) => b.severityScore - a.severityScore)
    .slice(0, 5)
    .map((x) => `${x.file} (${x.severityScore})`);

  console.log(`Scanned ${summary.total} .js files`);
  console.log(`Parse pass: ${summary.pass}`);
  console.log(`Parse fail: ${summary.fail}`);
  console.log(`JSON report: ${path.relative(repoRoot, args.outJson)}`);
  console.log(`CSV report: ${path.relative(repoRoot, args.outCsv)}`);
  console.log(`Fail JSON report: ${path.relative(repoRoot, args.outFailJson)}`);
  console.log(`Fail CSV report: ${path.relative(repoRoot, args.outFailCsv)}`);
  console.log(`Generated output included: ${args.includeGenerated}`);
  console.log('Top jQuery-heavy files:');
  topJquery.forEach((line) => console.log(`  - ${line}`));
  console.log('Top browser-global files:');
  topBrowser.forEach((line) => console.log(`  - ${line}`));
  console.log('Top migration-severity files:');
  topSeverity.forEach((line) => console.log(`  - ${line}`));
  console.log(`Failures in fail-only report: ${failureSummary.totalFailures}`);
}

main();