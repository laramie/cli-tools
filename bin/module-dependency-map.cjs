#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const projectRoot = process.cwd();
const outDir = path.join(projectRoot, '_TEMP_ONLY');
const outJsonDefault = path.join(outDir, 'module-dependency-map.json');
const outMdDefault = path.join(outDir, 'module-dependency-map.md');

function parseArgs(argv) {
  const args = {
    root: projectRoot,
    outJson: outJsonDefault,
    outMd: outMdDefault,
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
    } else if (token === '--out-md' && argv[i + 1]) {
      args.outMd = path.resolve(argv[i + 1]);
      i += 1;
    } else if (token === '--include-subdirs') {
      args.includeSubdirs = true;
    }
  }

  return args;
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function collectRootJsFiles(root, includeSubdirs) {
  if (!includeSubdirs) {
    return fs.readdirSync(root)
      .filter((name) => name.endsWith('.js'))
      .map((name) => path.join(root, name))
      .sort();
  }

  const skipDirs = new Set(['.git', 'node_modules', '_TEMP_ONLY', '_chat_conversations', 'img', 'songs', 'bin']);
  const files = [];

  function visit(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        visit(abs);
      } else if (entry.isFile() && abs.endsWith('.js')) {
        files.push(abs);
      }
    }
  }

  visit(root);
  return files.sort();
}

function rel(root, abs) {
  return toPosix(path.relative(root, abs));
}

function resolveImport(fromAbs, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromAbs), specifier);
  const candidates = [base, `${base}.js`, path.join(base, 'index.js')];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

function buildGraph(root, files) {
  const fileSet = new Set(files.map((f) => path.resolve(f)));
  const nodes = new Map();
  const inbound = new Map();
  const edges = [];

  for (const abs of files) {
    const sourceText = fs.readFileSync(abs, 'utf8');
    const sf = ts.createSourceFile(abs, sourceText, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
    const fromRel = rel(root, abs);

    const imports = [];
    const externalImports = [];
    const sideEffectImports = [];

    for (const stmt of sf.statements) {
      if (!ts.isImportDeclaration(stmt) || !stmt.moduleSpecifier) continue;
      const specifier = stmt.moduleSpecifier.text;
      const isSideEffectOnly = !stmt.importClause;
      const targetAbs = resolveImport(abs, specifier);

      if (!targetAbs) {
        externalImports.push(specifier);
        continue;
      }

      const targetRel = rel(root, targetAbs);
      if (isSideEffectOnly) sideEffectImports.push(targetRel);

      imports.push(targetRel);
      edges.push({ from: fromRel, to: targetRel, sideEffectOnly: isSideEffectOnly });

      if (!inbound.has(targetRel)) inbound.set(targetRel, new Set());
      inbound.get(targetRel).add(fromRel);
    }

    nodes.set(fromRel, {
      file: fromRel,
      importCount: imports.length,
      imports: [...new Set(imports)].sort(),
      sideEffectImports: [...new Set(sideEffectImports)].sort(),
      externalImports: [...new Set(externalImports)].sort(),
      inboundCount: 0,
      importedBy: []
    });
  }

  for (const [file, node] of nodes.entries()) {
    const inSet = inbound.get(file) || new Set();
    node.inboundCount = inSet.size;
    node.importedBy = [...inSet].sort();
  }

  return {
    nodeMap: nodes,
    edges,
    roots: [...fileSet].map((f) => rel(root, f)).sort()
  };
}

function findSccs(nodes) {
  const graph = new Map();
  for (const node of nodes) graph.set(node.file, node.imports.filter((t) => graph.has(t) || true));

  const indexByNode = new Map();
  const lowByNode = new Map();
  const stack = [];
  const onStack = new Set();
  let index = 0;
  const sccs = [];

  function strongConnect(v) {
    indexByNode.set(v, index);
    lowByNode.set(v, index);
    index += 1;
    stack.push(v);
    onStack.add(v);

    const neighbors = graph.get(v) || [];
    for (const w of neighbors) {
      if (!graph.has(w)) continue;
      if (!indexByNode.has(w)) {
        strongConnect(w);
        lowByNode.set(v, Math.min(lowByNode.get(v), lowByNode.get(w)));
      } else if (onStack.has(w)) {
        lowByNode.set(v, Math.min(lowByNode.get(v), indexByNode.get(w)));
      }
    }

    if (lowByNode.get(v) === indexByNode.get(v)) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 1) sccs.push(scc.sort());
    }
  }

  for (const node of graph.keys()) {
    if (!indexByNode.has(node)) strongConnect(node);
  }
  return sccs.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
}

function renderMd(report) {
  const lines = [];
  lines.push('# Module Dependency Map');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Scanned root files: ${report.scannedFileCount}`);
  lines.push(`Edges: ${report.edgeCount}`);
  lines.push(`Cyclic groups: ${report.cycles.length}`);
  lines.push('');

  lines.push('## Most Imported Modules');
  report.topInbound.forEach((n) => {
    lines.push(`- ${n.file} (${n.inboundCount})`);
  });
  lines.push('');

  lines.push('## Most Outbound Dependencies');
  report.topOutbound.forEach((n) => {
    lines.push(`- ${n.file} (${n.importCount})`);
  });
  lines.push('');

  lines.push('## Cycles');
  if (report.cycles.length === 0) {
    lines.push('- None');
  } else {
    report.cycles.forEach((cycle, idx) => {
      lines.push(`- Cycle ${idx + 1} (${cycle.length} files): ${cycle.join(' -> ')}`);
    });
  }
  lines.push('');

  lines.push('## Graph (Mermaid)');
  lines.push('```mermaid');
  lines.push('graph LR');
  report.edges.slice(0, 250).forEach((e) => {
    const from = e.from.replace(/[^a-zA-Z0-9_]/g, '_');
    const to = e.to.replace(/[^a-zA-Z0-9_]/g, '_');
    lines.push(`  ${from}["${e.from}"] --> ${to}["${e.to}"]`);
  });
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = collectRootJsFiles(args.root, args.includeSubdirs);
  const { nodeMap, edges } = buildGraph(args.root, files);
  const nodes = [...nodeMap.values()].sort((a, b) => a.file.localeCompare(b.file));
  const cycles = findSccs(nodes);

  const topInbound = [...nodes]
    .sort((a, b) => b.inboundCount - a.inboundCount || a.file.localeCompare(b.file))
    .slice(0, 10);
  const topOutbound = [...nodes]
    .sort((a, b) => b.importCount - a.importCount || a.file.localeCompare(b.file))
    .slice(0, 10);

  const report = {
    generatedAt: new Date().toISOString(),
    root: args.root,
    scannedFileCount: nodes.length,
    edgeCount: edges.length,
    topInbound,
    topOutbound,
    cycles,
    nodes,
    edges
  };

  fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
  fs.mkdirSync(path.dirname(args.outMd), { recursive: true });
  fs.writeFileSync(args.outJson, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(args.outMd, renderMd(report), 'utf8');

  console.log(`Scanned root JS files: ${report.scannedFileCount}`);
  console.log(`Edges: ${report.edgeCount}`);
  console.log(`Cycles: ${report.cycles.length}`);
  console.log(`JSON report: ${rel(args.root, args.outJson)}`);
  console.log(`Markdown report: ${rel(args.root, args.outMd)}`);
  console.log('Top inbound:');
  topInbound.slice(0, 5).forEach((n) => console.log(`  - ${n.file} (${n.inboundCount})`));
  console.log('Top outbound:');
  topOutbound.slice(0, 5).forEach((n) => console.log(`  - ${n.file} (${n.importCount})`));
}

main();