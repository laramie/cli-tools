#!/usr/bin/env node
// Node.js utility to search files in a directory with regex suites
const fs = require('fs');
const path = require('path');
const { IndentStyle } = require('./node_modules/typescript/lib/typescript');

const FIND_FUNCTIONS = /\s+export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*.*)/g;

const FIND_EXPORT_FUNCTIONS = /\s+(export\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*.*)/g;

const FIND_FUNCTION_INVOCATIONS = /(?<!\.)\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b\s*(?=\(|;|$)/g;

// TODO: don't need this any more because it's identical to FIND_FUNCTION_INVOCATIONS 
//      and we deal with NO_LANG with SUPPRESS_IDENTIFIERS and FRAMEWORK_FUNCTIONS
const FIND_FUNCTION_INVOCATIONS_NO_LANG = /(?<!\.)\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b\s*(?=\(|;|$)/g;

// List of keywords and identifiers to suppress (can include regex patterns)
const SUPPRESS_IDENTIFIERS = [
    'if', 'switch', 'case', 'while', 'for', 'return', 'typeof', 'isNaN'
];

const FRAMEWORK_FUNCTIONS = [
    'test', '$'
];

const IMPORTS_SUITE = 0;
// --- Regex suites ---
const regexReplacerSuites = [
    {
        name: '0:IMPORT_SUITE',
        regex: FIND_FUNCTIONS,
        description: 'Functions in file:',
        expression: '${match[1]},'
    },
    {
        name: '1:function-lines',
        regex: FIND_FUNCTIONS,
        description: 'Lines with functions:',
        expression: '${match[0]}'
    },
    {
        name: '2:exported-functions-keyword',
        regex: FIND_EXPORT_FUNCTIONS,
        description: '[export] function <function-name>:',
        expression: '${match[1]}function ${match[2]}'
    },
    {
        name: '3:function-invocation-lines',
        regex: FIND_FUNCTION_INVOCATIONS,
        description: 'Lines with invocations:',
        expression: '${match[0]}',
        keywords: SUPPRESS_IDENTIFIERS
    },
    {
        name: '5:function-invocations-nolang',
        regex: FIND_FUNCTION_INVOCATIONS,
        description: 'invocations(noLang):',
        expression: '${match[1]}',
        keywords: SUPPRESS_IDENTIFIERS
    },
    {
        name: '6:function-invocations-no-lang-no-framework',
        regex: FIND_FUNCTION_INVOCATIONS,
        description: 'invocations(noLang,noFramework):',
        expression: '${match[1]}',
        keywords: SUPPRESS_IDENTIFIERS,
        frameworkFunctions: FRAMEWORK_FUNCTIONS
    }
];

const args = process.argv.slice(2);
let suiteIdx = 3;
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

if (!regexReplacerSuites[suiteIdx]) {
    console.error('Invalid suite index.');
    regexReplacerSuites
    process.exit(1);
}

const { regex, name, description, expression } = regexReplacerSuites[suiteIdx];

console.log(`Running suite: ${name} (${description})`);
console.log(`Directory: ${dir}`);
console.log(`Extensions: ${extensions.join(', ')}`);

// --- Main logic ---
fs.readdir(dir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        process.exit(1);
    }
    const states = [];
    files.filter(file => extensions.includes(path.extname(file)))
        .forEach(file => {
            let state = new State();
            states.push(state);
            state.filename = file;
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            let match;
            let found = false;

            while ((match = regex.exec(content)) !== null) {
                // Suppress unwanted identifiers for FIND_FUNCTION_INVOCATIONS_NO_LANG
                let suppress = false;
                if (regex === FIND_FUNCTION_INVOCATIONS_NO_LANG) {
                    const identifier = match[1];
                    suppress = SUPPRESS_IDENTIFIERS.some(kw => {
                        if (kw.startsWith('/') && kw.endsWith('/')) {
                            // Treat as regex
                            const re = new RegExp(kw.slice(1, -1));
                            return re.test(identifier);
                        } else {
                            return kw === identifier;
                        }
                    });
                }
                if (!suppress) {
                    if (!found) {
                        state.foundBegin();
                        console.log(`\nFile: ${file}`);
                        found = true;
                    }
                    if (expression) {
                        const output = expression.replace(/\$\{match\[(\d+)\]\}/g, (m, idx) => match[idx] || '');
                        console.log(`  ${output}`);
                        state.addLine(`${output}`);
                    }
                }
            }
            state.foundEnd();
        });
    //END files.filter.
    states.forEach(theState => {
        if (theState.quantifyFound()>0){
            console.log(description + theState.dump());
        }
    });
    states.forEach(theState => {
        if (theState.quantifyFound()===0){
            console.log("None found in: " + theState.filename);
        }
    });
});

class State {
    #foundBegin = false;
    #foundEnd = false;
    #lines = [];

    filename = "";
    quantifyFound() {
        return this.#lines.length;
    }
    foundBegin() {
        this.#foundBegin = true;
    }
    foundEnd() {
        this.#foundEnd = true;
    }
    addLine(line) {
        this.#lines.push(line);
    }
    toJSON() {
        if (this.#lines.length === 0) {
            return {
                filename: this.filename
            };
        } else {
            return {
                filename: this.filename,
                quantifyFound: this.#lines.length,
                lines: this.#lines
            };
        }
    }
    dump() {
        return JSON.stringify(this, null, 4);
    }
}
