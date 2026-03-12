#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const projectRoot = process.cwd();
const outDir = path.join(projectRoot, '_TEMP_ONLY');
const outJson = path.join(outDir, 'module-export-audit.json');

const ignoredNames = new Set([
  '$',
  'jQuery'
]);

function parseArgs(argv) {
  const args = {
    root: projectRoot,
    outJson,
    includeSubdirs: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--root' && argv[i + 1]) {
      args.root = path.resolve(argv[i + 1]);
      i += 1;
    } else if (token === '--out-json' && argv[i + 1]) {
      args.outJson = path.resolve(argv[i + 1]);
      i += 1;
    } else if (token === '--include-subdirs') {
      args.includeSubdirs = true;
    }
  }

  return args;
}

function isRootJsFile(root, absPath) {
  return path.dirname(absPath) === root && absPath.endsWith('.js');
}

function collectJsFiles(root, includeSubdirs) {
  if (!includeSubdirs) {
    return fs.readdirSync(root)
      .filter((name) => name.endsWith('.js'))
      .map((name) => path.join(root, name))
      .sort();
  }

  const skipDirs = new Set(['.git', 'node_modules', '_chat_conversations', '_TEMP_ONLY', 'img', 'songs', 'bin']);
  const files = [];

  function visit(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        visit(absPath);
      } else if (entry.isFile() && absPath.endsWith('.js')) {
        files.push(absPath);
      }
    }
  }

  visit(root);
  return files.sort();
}

function toRel(root, absPath) {
  return path.relative(root, absPath).split(path.sep).join('/');
}

function getNameFromBindingName(nameNode) {
  if (!nameNode) return [];
  if (ts.isIdentifier(nameNode)) return [nameNode.text];
  if (ts.isObjectBindingPattern(nameNode) || ts.isArrayBindingPattern(nameNode)) {
    const names = [];
    for (const el of nameNode.elements || []) {
      if (ts.isBindingElement(el)) {
        names.push(...getNameFromBindingName(el.name));
      }
    }
    return names;
  }
  return [];
}

function hasExportModifier(node) {
  const modifiers = ts.getModifiers(node) || [];
  return modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

function collectDeclarationsAndExports(sourceFile) {
  const declared = new Set();
  const exported = new Set();

  function maybeMarkExport(node, names) {
    if (hasExportModifier(node)) {
      names.forEach((n) => exported.add(n));
    }
  }

  for (const stmt of sourceFile.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name) {
      declared.add(stmt.name.text);
      maybeMarkExport(stmt, [stmt.name.text]);
    } else if (ts.isClassDeclaration(stmt) && stmt.name) {
      declared.add(stmt.name.text);
      maybeMarkExport(stmt, [stmt.name.text]);
    } else if (ts.isVariableStatement(stmt)) {
      const varNames = [];
      for (const decl of stmt.declarationList.declarations) {
        varNames.push(...getNameFromBindingName(decl.name));
      }
      varNames.forEach((n) => declared.add(n));
      maybeMarkExport(stmt, varNames);
    } else if (ts.isExportDeclaration(stmt) && stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
      for (const element of stmt.exportClause.elements) {
        if (element.propertyName) {
          exported.add(element.propertyName.text);
          exported.add(element.name.text);
        } else {
          exported.add(element.name.text);
        }
      }
    }
  }

  return { declared, exported };
}

function collectMissingNames(program, root) {
  const diagnostics = [];
  for (const sf of program.getSourceFiles()) {
    if (!sf.fileName.endsWith('.js')) continue;
    const abs = path.resolve(sf.fileName);
    if (!isRootJsFile(root, abs)) continue;
    diagnostics.push(...program.getSemanticDiagnostics(sf));
  }

  const missing = [];
  for (const d of diagnostics) {
    if (d.code !== 2304) continue;
    if (!d.file) continue;
    const text = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    const match = text.match(/Cannot find name '([^']+)'/);
    if (!match) continue;
    const name = match[1];
    if (ignoredNames.has(name)) continue;

    const lc = d.file.getLineAndCharacterOfPosition(d.start || 0);
    missing.push({
      file: toRel(root, d.file.fileName),
      line: lc.line + 1,
      column: lc.character + 1,
      name,
      message: text
    });
  }

  const dedup = new Map();
  for (const item of missing) {
    const key = `${item.file}:${item.line}:${item.column}:${item.name}`;
    if (!dedup.has(key)) dedup.set(key, item);
  }
  return [...dedup.values()];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = collectJsFiles(args.root, args.includeSubdirs);
  const options = {
    allowJs: true,
    checkJs: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    allowSyntheticDefaultImports: true
  };
  const host = ts.createCompilerHost(options);
  const program = ts.createProgram(files, options, host);

  const declarationsByName = new Map();
  for (const sf of program.getSourceFiles()) {
    const abs = path.resolve(sf.fileName);
    if (!isRootJsFile(args.root, abs)) continue;
    const rel = toRel(args.root, abs);
    const info = collectDeclarationsAndExports(sf);
    for (const name of info.declared) {
      if (!declarationsByName.has(name)) declarationsByName.set(name, []);
      declarationsByName.get(name).push({
        file: rel,
        isExported: info.exported.has(name)
      });
    }
  }

  const missing = collectMissingNames(program, args.root);
  const unresolvedWithCandidates = missing.map((item) => {
    const candidates = (declarationsByName.get(item.name) || [])
      .filter((c) => c.file !== item.file)
      .sort((a, b) => Number(b.isExported) - Number(a.isExported) || a.file.localeCompare(b.file));
    return {
      ...item,
      candidates
    };
  });

  const groupedByName = new Map();
  for (const item of unresolvedWithCandidates) {
    if (!groupedByName.has(item.name)) groupedByName.set(item.name, []);
    groupedByName.get(item.name).push(item);
  }

  const suggestions = [];
  for (const [name, items] of groupedByName.entries()) {
    const candidateCounts = new Map();
    for (const item of items) {
      for (const c of item.candidates) {
        const key = `${c.file}|${c.isExported}`;
        candidateCounts.set(key, (candidateCounts.get(key) || 0) + 1);
      }
    }
    const rankedCandidates = [...candidateCounts.entries()]
      .map(([key, count]) => {
        const [file, isExportedRaw] = key.split('|');
        return { file, isExported: isExportedRaw === 'true', usageCount: count };
      })
      .sort((a, b) => Number(b.isExported) - Number(a.isExported) || b.usageCount - a.usageCount || a.file.localeCompare(b.file));

    suggestions.push({
      symbol: name,
      unresolvedUsages: items.length,
      topCandidates: rankedCandidates.slice(0, 3)
    });
  }

  suggestions.sort((a, b) => b.unresolvedUsages - a.unresolvedUsages || a.symbol.localeCompare(b.symbol));

  const report = {
    generatedAt: new Date().toISOString(),
    root: args.root,
    scannedFileCount: files.length,
    unresolvedCount: unresolvedWithCandidates.length,
    unresolved: unresolvedWithCandidates,
    suggestions
  };

  fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
  fs.writeFileSync(args.outJson, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Scanned root JS files: ${files.length}`);
  console.log(`Unresolved symbol usages: ${unresolvedWithCandidates.length}`);
  console.log(`Report: ${toRel(args.root, args.outJson)}`);

  const top = suggestions.slice(0, 12);
  if (top.length === 0) {
    console.log('No unresolved cross-module symbol usages found.');
    return;
  }

  console.log('Top unresolved symbols and candidate providers:');
  for (const row of top) {
    const cand = row.topCandidates[0];
    if (!cand) {
      console.log(`  - ${row.symbol}: ${row.unresolvedUsages} usages, no provider candidate`);
      continue;
    }
    const mode = cand.isExported ? 'already exported' : 'needs export';
    console.log(`  - ${row.symbol}: ${row.unresolvedUsages} usages, suggest ${cand.file} (${mode})`);
  }
}

main();