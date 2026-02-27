#!/usr/bin/env node
// Node.js utility to search files in a directory with regex suites
const fs = require('fs');
const path = require('path');
const { IndentStyle } = require('./node_modules/typescript/lib/typescript');

const FIND_FUNCTIONS = /\s+export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*.*)/g;

const IMPORTS_SUITE = 3;
// --- Regex suites ---
const regexSuites = [
    {
        name: '0: exported-functions',
        regex: FIND_FUNCTIONS,
        description: 'Finds exported functions, verbose',
        expression: 'Match: ${match[0]}'
    },
    {
        name: '1: exported-functions-name',
        regex: FIND_FUNCTIONS,
        description: 'Finds exported functions, function name output',
        expression: 'function: ${match[1]}'
    },
    {
        name: '2: exported-functions-name-only',
        regex: FIND_FUNCTIONS,
        description: 'Finds exported functions, function name only',
        expression: '${match[1]}'
    },
    {
        name: '3: exported-functions-generate-input',
        regex: FIND_FUNCTIONS,
        description: 'generate import statement',
        expression: '${match[1]},'
    }
];

const args = process.argv.slice(2);
let suiteIdx = 0;
let extensions = ['.js', '.txt'];
let dir = process.cwd();

args.forEach(arg => {
    if (arg.startsWith('--suite=')) {
        suiteIdx = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--ext=')) {
        extensions = arg.split('=')[1].split(',').map(e => e.startsWith('.') ? e : '.' + e);
    } else if (arg.startsWith('--dir=')) {
        dir = arg.split('=')[1];
    }
});

if (!regexSuites[suiteIdx]) {
    console.error('Invalid suite index.');
    process.exit(1);
}

const { regex, name, description, expression } = regexSuites[suiteIdx];

console.log(`Running suite: ${name} (${description})`);
console.log(`Directory: ${dir}`);
console.log(`Extensions: ${extensions.join(', ')}`);

// --- Main logic ---
fs.readdir(dir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        process.exit(1);
    }
    files.filter(file => extensions.includes(path.extname(file)))
        .forEach(file => {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            let match;
            let found = false;
            let quantifyFound = 0;

            while ((match = regex.exec(content)) !== null) {
                if (!found) {
                    console.log(`\nFile: ${file}`);
                    if (suiteIdx === IMPORTS_SUITE) {
                        console.log(`\nimport {`);
                    }
                    found = true;
                }
                if (expression) {
                    // Expand ${match[n]} in the expression string
                    const output = expression.replace(/\$\{match\[(\d+)\]\}/g, (m, idx) => match[idx] || '');
                    console.log(`  ${output}`);
                    quantifyFound++;
                } else {
                    console.log(`  Match: ${match[0]}`);
                }
            }
            if (suiteIdx === IMPORTS_SUITE && quantifyFound > 0) console.log(`} from './${file}'`);
        });
});
