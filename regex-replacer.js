#!/usr/bin/env node
// Node.js utility to search files in a directory with regex suites
const fs = require('fs');
const path = require('path');
const { IndentStyle } = require('./node_modules/typescript/lib/typescript');

const FIND_FUNCTIONS = /^\s*export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*.*)/gm;

//const FIND_EXPORT_FUNCTIONS = /^\s*(export\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*.*)/gm;

//const FIND_FUNCTION_INVOCATIONS = /(?<!\.)\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b\s*(?=\(|;|$)/g;

const FIND_EXPORT_FUNCTIONS = /^\s*(?:export\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm

const FIND_INVOCATIONS = /(?<!\.|\'|\")\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g

// List of keywords and identifiers to suppress (can include regex patterns)
const SUPPRESS_IDENTIFIERS = [
    'function', 'if', 'switch', 'case', 'while', 'for', 'return', 'typeof', 'isNaN'
];

// List of more identifiers to suppress based on frameworks used (can include regex patterns)
const FRAMEWORK_FUNCTIONS = [
    'test', '$', 'rgb', 'makeSong' 
];

const DEFAULT_SUITE = 0;

const SUITES = [
    {
        name: '0:IMPORT_SUITE',
        regex: FIND_FUNCTIONS,
        description: 'Functions in file:',
        expression: '${match[1]}'
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
        regex: FIND_INVOCATIONS,
        description: 'Lines with invocations:',
        expression: '${match[0]}',
        keywords: SUPPRESS_IDENTIFIERS
    },
    {
        name: '4:function-invocations-nolang',
        regex: FIND_INVOCATIONS,
        description: 'invocations(noLang):',
        expression: '${match[1]}',
        keywords: SUPPRESS_IDENTIFIERS,
        frameworkFunctions: []
    },
    {
        name: '5:function-invocations-no-lang-no-framework',
        regex: FIND_INVOCATIONS,
        description: 'invocations(noLang,noFramework):',
        expression: '${match[1]}',
        keywords: SUPPRESS_IDENTIFIERS,
        frameworkFunctions: FRAMEWORK_FUNCTIONS
    }
];

function formatSuite(oneSuite, sIDx){
    return "Suite["+sIDx+"]:\n" + JSON.stringify(oneSuite, (key, value) =>
                value instanceof RegExp ? value.toString() : value, 4)

}

function printHelpDivider(){
    console.log("==================================================\n");
}

function printSuites(){
        SUITES.forEach((oneSuite, sIDx) => {console.log(formatSuite(oneSuite, sIDx))});
        printHelpDivider();
}

function printHelp(){
    console.log(
             "Command-line options:\n"
            +"  --filenames  --fi    :ouput filenames\n"
            +"  --help       --h     :show this message and quit\n"
            +"  --lines      --li    :ouput line\n"
            +"  --location   --lo    :out source character location\n"
            +"  --quiet      --q     :no info messages\n"
            +"  --sort       --so    :sort lines\n"
            +"  --tests      --te    :print suites of tests\n"
            +"  --summary    --sum   :ouput summary (default, or if no lines or filenames output\n"
        );
}

const args = process.argv.slice(2);
let suiteIdx = DEFAULT_SUITE;
let extensions = ['.js', '.txt'];
let dir = process.cwd();
let singleFile = null;

let options = {
    quiet : false,
    outputFilename : false,
    outputLines : false,
    outputSummary : false,   
    outputSourceLocation : false,
    outputSortedLines : false
}

args.forEach(arg => {
    if (arg.startsWith('--suite=')) {
        suiteIdx = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--ext=')) {
        extensions = arg.split('=')[1].split(',').map(e => e.startsWith('.') ? e : '.' + e);
    } else if (arg.startsWith('--dir=')) {
        dir = arg.split('=')[1];
    } else if (arg.startsWith("--li")) {      //-lines
        options.outputLines = true;
    } else if (arg.startsWith("--sum")) {     //--summary
        options.outputSummary = true;    
    } else if (arg.startsWith("--so")) {      //--sort
        options.outputSortedLines = true;    
    } else if (arg.startsWith("--lo")) {      //--location
        options.outputSourceLocation = true;
    } else if (arg.startsWith("--fi")) {      //--filenames
        options.outputFilename = true;
    } else if (arg.startsWith("--q")) {       //--quiet
        options.quiet = true;
    } else if (arg.startsWith("--te")) {     //--testSuites
        printHelpDivider();                   // if you want to quit after seeing suites, run with: --suites --h
        printSuites();
    } else if (arg.startsWith("--h")) {      //--help
        printHelp();
        process.exit(1);
    }
});
if (options.outputLines == false && options.outputFilename == false){
    options.outputSummary = true;
}

// If the last argument is not an option, treat it as a filename
if (args.length > 0) {
    const lastArg = args[args.length - 1];
    if (!lastArg.startsWith('--')) {
        singleFile = lastArg;
    }
}

if (!SUITES[suiteIdx]) {
    console.error('Invalid suite index: '+suiteIdx);
    console.log("Please choose from the following:");
    printHelpDivider();
    printSuites();
    process.exit(1);
}

const { regex, name, description, expression } = SUITES[suiteIdx];

const suite = SUITES[suiteIdx];
            

if (!options.quiet){
    console.log(`Running suite[${suiteIdx}]: ${name} (${description})`);
    console.log(`Directory: ${dir}`);
    if(singleFile){
        console.log(`Single file: ${singleFile}`);
    } else {
        console.log(`Extensions: ${extensions.join(', ')}`);
    }
    console.log("Suite:\n" + JSON.stringify(SUITES[suiteIdx], (key, value) =>
                value instanceof RegExp ? value.toString() : value, 4));
    console.log("Options:\n" + JSON.stringify(options,null,4));
}

// --- Main logic ---
fs.readdir(dir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        process.exit(1);
    }
    const states = [];
    let targetFiles;
    if (singleFile) {
        targetFiles = [singleFile];
    } else {
        targetFiles = files.filter(file => extensions.includes(path.extname(file)));
    }
    targetFiles.forEach(file => {
        let state = new State();
        states.push(state);
        state.filename = file;
        const filePath = singleFile ? file : path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        let match;
        let found = false;

        while ((match = regex.exec(content)) !== null) {
            let suppress = false;
            const identifier = match[1];
            let suppressList = [];
            if (suite.keywords && Array.isArray(suite.keywords)) {
                suppressList = suppressList.concat(suite.keywords);
            }
            if (suite.frameworkFunctions && Array.isArray(suite.frameworkFunctions)) {
                suppressList = suppressList.concat(suite.frameworkFunctions);
            }
            if (suppressList.length > 0 && identifier) {
                suppress = suppressList.some(kw => {
                    if (typeof kw === 'string' && kw.startsWith('/') && kw.endsWith('/')) {
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
                    found = true;
                }
                if (expression) {
                    const output = expression.replace(/\$\{match\[(\d+)\]\}/g, (m, idx) => match[idx] || '');
                    //if (output&&output.trim().length) {
                        const startIndex = regex.lastIndex - match[0].length;
                        const upToMatch = content.slice(0, startIndex);  // Count lines up to startIndex
                        const lineNumber = upToMatch.split('\n').length;
                        state.addLine(output.trim(), lineNumber, startIndex);
                    //}
                }
            }
        }
        state.foundEnd();
    });
    states.forEach(theState => {
        if (theState.quantifyFound()>0){
             if (options.outputSummary){
                console.log(theState.printSummary());
             }
            if (options.outputLines){
                if (options.outputFilename){
                    console.log("\n\n====filename====:"+theState.printFilename());
                }
                if (options.outputSortedLines){
                    console.log(theState.printLinesSorted());
                } else {
                    console.log(theState.printLines());
                }
            }
        }
    });
    let notFoundHeaderPrinted = false;
    states.forEach(theState => {
        if (theState.quantifyFound()===0 && options.outputFilename){
            if (!notFoundHeaderPrinted){
                console.log("\n\n============= None found in these files ==========");
                notFoundHeaderPrinted = true;
            }
            console.log(theState.printFilename());
        }
    });
    if (notFoundHeaderPrinted){
        printHelpDivider();
    }
    console.log("");
});

class State {
    #foundBegin = false;
    #foundEnd = false;
    #lines = [];
    #lineSet = new Set();

    addLine(line, linenum, startIndex) {
        if (!this.#lineSet.has(line)) {
            this.#lines.push({ line, linenum, startIndex });
            this.#lineSet.add(line);
        }
    }
    printLines() {
        return this.#lines.map(obj =>
            options.outputSourceLocation
                ? 
                `${obj.linenum.toString().padStart(6, ' ')}\t[${obj.startIndex.toString().padStart(6, ' ')}]:\t${obj.line}`
                : obj.line
        ).join('\n');
    }
    printLinesSorted() {
        // Sort a copy of #lines by line content, do not mutate #lines
        const sorted = [...this.#lines].sort((a, b) => {
            if (a.line < b.line) return -1;
            if (a.line > b.line) return 1;
            return 0;
        });
        return sorted.map(obj =>
            options.outputSourceLocation
                ? 
                `${obj.linenum.toString().padStart(6, ' ')}\t[${obj.startIndex.toString().padStart(6, ' ')}]:\t${obj.line}`
                : obj.line
        ).join('\n');
    }
    printFilename(){
        return this.filename;
    }
    printSummary(){
        return JSON.stringify(this.toJSON(), null, 4);
    }

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
    toJSON(){
        if (options.outputSourceLocation){
            return {
                    filename: this.filename,
                    quantifyFound: this.#lines.length,
                    lines: this.#lines
            };
        } else {
            return {
                filename: this.filename,
                quantifyFound: this.#lines.length,
                lines: this.#lines,
                foo: "bar"
            }
        }
    }
    toFilteredObject() {  //   this.toFilteredObject()
        if (this.#lines.length === 0) {
            return {
                filename: this.filename
            };
        } else {
            if (options.outputSourceLocation){
                return {
                    filename: this.filename,
                    quantifyFound: this.#lines.length,
                    lines: this.#lines,
                };
            } else {
                return {
                    filename: this.filename,
                    quantifyFound: this.#lines.length,
                    lines: this.#lines.filter(obj => {
                                                obj.line
                                             })
                };
            }
        }
    }
    
}
