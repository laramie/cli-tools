#!/usr/bin/env node
/* Node.js utility to search files in a directory with regex suites
    Run on the bash command line like so, since ths file has a shebang.
        cd ~/infinite-neck
        ./bin/find-js-dependencies.js --h
    e.g.
        laramie@penguin:~/infinite-neck$ ./bin/find-js-dependencies.js --h
*/

import { readdir, readFileSync } from 'fs';
import { extname, join } from 'path';

const DEFAULT_SUITE = 0;

const SUPPRESS_IDENTIFIERS = [       // List of keywords and identifiers to suppress (can include regex patterns)
    'function', 'if', 'switch', 'case', 'while', 'for', 'return', 'typeof', 'isNaN'
];
const FRAMEWORK_FUNCTIONS = [       // List of more identifiers to suppress based on frameworks used (can include regex patterns)
    'test', '$', 'rgb', 'makeSong' 
];

const FIND_FUNCTIONS =            /^(\s*(?:export\s+)?)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
const FIND_NON_EXPORT_FUNCTIONS = /^(\s*)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
const FIND_EXPORT_FUNCTIONS =     /^(\s*export\s+)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
const FIND_ALL_EXPORTS =          /^(\s*export\s+)\s*(const|var|let|class|default|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
const FIND_INVOCATIONS =          /(?<!\.|'|"|\b(?:export|const|var|let|class|default|function)\s+)\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
const FIND_INVOCATION_LINES =     /^.*(?<!\.|'|"|\b(?:export|const|var|let|class|default|function)\s+)\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm

const SUITES = [
    {     
        name: 'functions',
        regex: FIND_FUNCTIONS,
        description: 'Find functions in file',
        expression: '${match[1]}${match[2]} ${match[3]}'
    },
    {     
        name: 'functions-no-exports',
        regex: FIND_NON_EXPORT_FUNCTIONS,
        description: 'Find functions in file',
        expression: '${match[1]}${match[2]} ${match[3]}'
    },
    {   
        name: 'function-lines',
        regex: FIND_FUNCTIONS,
        description: 'Lines with functions in file',
        expression: '${match[0]}'
    },
    {   
        name: 'export-functions',
        regex: FIND_EXPORT_FUNCTIONS,
        description: '[export] function <function-name>',
        expression: '${match[1]}${match[2]} ${match[3]}'
    },
    {   
        name: 'exports',
        regex: FIND_ALL_EXPORTS,
        description: '[export] function <function-name>',
        expression: '${match[1]}${match[2]} ${match[3]}'
    },
    {   
        name: 'invocation-lines',
        regex: FIND_INVOCATION_LINES,
        description: 'Find invocations in file (whole line)',
        expression: '${match[0]}',
        keywords: SUPPRESS_IDENTIFIERS
    },
    {   
        name: 'invocations',
        regex: FIND_INVOCATIONS,
        description: 'Find invocations in file (noLang)',
        expression: '${match[1]}',
        keywords: SUPPRESS_IDENTIFIERS,
        frameworkFunctions: []
    },
    {   
        name: 'invocations-no-framework',
        regex: FIND_INVOCATIONS,
        description: 'Find invocations in file (noLang,noFramework)',
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
    console.log("==================================================");
}

function printSuites(){
        SUITES.forEach((oneSuite, sIDx) => {console.log(formatSuite(oneSuite, sIDx))});
        printHelpDivider();
}

function printSuiteNames(){
    SUITES.forEach((oneSuite) => {console.log(oneSuite.name)});
}

function printHelp(){
    console.log(
             "Command-line options:\n"
            +"  --all                  :all lines, including duplicates.\n"
            +"  --filenames |  --fi    :ouput filenames.\n"
            +"  --help      |  --h     :show this message and quit.\n"
            +"  --lines     |  --li    :ouput lines.\n"
            +"  --location  |  --lo    :out source character location.\n"
            +"  --quiet     |  --q     :no info messages\n"
            +"  --sort      |  --so    :sort lines.\n"
            +"  --summary   |  --su    :ouput summary (true if no --lines or --filenames output\n"
            +"  --tests     |  --te    :print suites of tests.\n"
            +"  --suites               :print suites of tests.\n"
            +"  --suitenames           :print suites.name only.\n"
            +"  --verbose   |  --v     :extra debugging information.\n"
            +"\n"
            +"  --dir=/my/dir          :dir to run in [ /my/dir ], else run in the current directory.\n"
            +"  --ext='*.js,*.txt'     :extensions to run [ *.js,*.txt ].\n"
            +"  --suite=0              :which test suite to run, [ 0 ] in this case.\n"
            +"  --suite=functions      :which test suite to run, [ functions ] in this case.\n"
            +"                             - may use indices [ 0 ]\n"
            +'                             - may use "name" as shown with --tests\n'
            +"                             - Run with --tests --help to show suites and quit.\n"
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
    outputSortedLines : false,
    verbose: false
}

args.forEach(arg => {
    if (arg.startsWith('--suite=')) {
        let suiteArg = arg.split('=')[1];
        // Try integer first
        let idx = Number(suiteArg);
        if (Number.isInteger(idx) && idx >= 0 && idx < SUITES.length) {
            suiteIdx = idx;
        } else {
            // Only allow hyphenated identifiers, ignore spaces in SUITES.name
            let foundIdx = SUITES.findIndex(suite => suite.name.replace(/\s+/g, '') === suiteArg);
            if (foundIdx !== -1) {
                suiteIdx = foundIdx;
            } else {
                console.error('Invalid suite identifier: ' + suiteArg);
                console.log('Please choose from the following:');
                printHelpDivider();
                printSuites();
                process.exit(1);
            }
        }
    } else if (arg.startsWith('--ext=')) {
        extensions = arg.split('=')[1].split(',').map(e => e.startsWith('.') ? e : '.' + e);
    } else if (arg.startsWith('--dir=')) {
        dir = arg.split('=')[1];
    } else if (arg.startsWith("--all")) {      //--all
        options.outputAll = true;
    } else if (arg.startsWith("--fi")) {      //--filenames
        options.outputFilename = true;
    } else if (arg.startsWith("--li")) {      //--lines
        options.outputLines = true;
    } else if (arg.startsWith("--lo")) {      //--location
        options.outputSourceLocation = true;
    } else if (arg.startsWith("--q")) {       //--quiet
        options.quiet = true;
    } else if (arg.startsWith("--so")) {      //--sort
        options.outputSortedLines = true;    
    } else if (arg.startsWith("--sum")) {     //--summary
        options.outputSummary = true;    
    } else if (arg.startsWith("--te")         //--tests
             ||arg.startsWith("--suites")) {  //--suites
        printHelpDivider();                   // if you want to quit after seeing suites, run with: --suites --h
        printSuites();
    } else if (arg.startsWith("--suitenames")) { //--suitenames
        printSuiteNames();
        process.exit(1);
    } else if (arg.startsWith("--v")) {       //--verbose
        options.verbose = true;
    } else if (arg.startsWith("--h")) {       //--help
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
    console.log(`Running suite[${suiteIdx}]:${name} (${description})`);
    console.log(`Directory: ${dir}`);
    if(singleFile){
        console.log(`Single file: ${singleFile}`);
    } else {
        console.log(`Extensions: ${extensions.join(', ')}`);
    }
    console.log("Suite:\n" + JSON.stringify(SUITES[suiteIdx], (key, value) =>
                value instanceof RegExp ? value.toString() : value, 4));
    console.log("Options:\n" + JSON.stringify(options,null,4));
} else if (options.outputFilename || options.outputSummary){
    //We are not doing lines-only output destined for text processing, so at least print out the suite description:
    printHelpDivider()
    console.log("Suite: "+suiteIdx + "  "+ suite.description ); 
    printHelpDivider()
}

if (options.verbose) console.log("\n********* Directory ************"+dir+"************\n");
// --- Main logic ---
readdir(dir, (err, files) => {
    if (options.verbose) console.log("********* Files in Dir **********"+files+"\n*****************************************************\n");
    if (err) {
        console.error('Error reading directory:', err);
        process.exit(1);
    }
    const states = [];
    let targetFiles;
    if (singleFile) {
        targetFiles = [singleFile];
    } else {
        targetFiles = files.filter(file => extensions.includes(extname(file)));
    }
    if (options.verbose)     console.log("********* Files for Processing*************"+targetFiles+"\n*****************************************************\n");
    targetFiles.forEach(file => {
        if (options.verbose) console.log("********* Processing ******"+file+"************");
        let state = new State();
        states.push(state);
        state.filename = file;
        const filePath = singleFile ? file : join(dir, file);
        const content = readFileSync(filePath, 'utf8');
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
                        state.addLine(output.trim(), lineNumber, startIndex, options.outputAll);
                    //}
                }
            }
        }
        state.foundEnd();
    });
    states.forEach(theState => {
        if (theState.quantifyFound()>0){
            if (options.outputLines){
                if (options.outputFilename){
                    console.log("\n\n💾 ===========  file: "+theState.printFilename() + "  =====================\n");
                }
                if (options.outputSortedLines){
                    console.log(theState.printLinesSorted(options));
                } else {
                    console.log(theState.printLines(options));
                }
            }
            if (options.outputSummary){
                console.log("\n👉 Summary: "+theState.printSummary(options));
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

    addLine(line, linenum, startIndex, all) {
        if (all || !this.#lineSet.has(line)) {
            this.#lines.push({ line, linenum, startIndex });
            this.#lineSet.add(line);
        }
    }
    printLines(outputOptions) {
        return this.#lines.map(obj =>
            outputOptions.outputSourceLocation
                ? 
                `${obj.linenum.toString().padStart(6, ' ')}\t[${obj.startIndex.toString().padStart(6, ' ')}]:\t${obj.line}`
                : obj.line
        ).join('\n');
    }
    printLinesSorted(outputOptions) {
        // Sort a copy of #lines by line content, do not mutate #lines
        const sorted = [...this.#lines].sort((a, b) => {
            if (a.line < b.line) return -1;
            if (a.line > b.line) return 1;
            return 0;
        });
        return sorted.map(obj =>
            outputOptions.outputSourceLocation
                ? 
                `${obj.linenum.toString().padStart(6, ' ')}\t[${obj.startIndex.toString().padStart(6, ' ')}]:\t${obj.line}`
                : obj.line
        ).join('\n');
    }
    printFilename(){
        return this.filename;
    }
    printSummary(outputOptions){
        return JSON.stringify(this.toJSON(outputOptions), null, 4);
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
    toJSON(outputOptions){
        if (outputOptions.outputSourceLocation){
            return {
                    filename: this.filename,
                    quantifyFound: this.#lines.length,
                    lines: this.#lines
            };
        } else {
            return {
                filename: this.filename,
                quantifyFound: this.#lines.length,
                lines: this.#lines.map(obj => obj.line),
            }
        }
    }
    
}
