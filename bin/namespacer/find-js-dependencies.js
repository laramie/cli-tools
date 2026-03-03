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

const COLORS = {
    //Reset/General',
    Reset: '\x1b[0m', 
    //Text Decorations',
    Bold: '\x1b[1m',
    Dim:  '\x1b[2m',
    Underline: '\x1b[4m',
    Inverse: '\x1b[7m',
    //Foreground Colors',
    Black: '\x1b[30m',
    Red: '\x1b[31m',
    Green: '\x1b[32m',
    Yellow: '\x1b[33m',
    Blue: '\x1b[34m',
    Magenta: '\x1b[35m',
    Cyan: '\x1b[36m',
    White: '\x1b[37m',
    //Background Colors',
    BgBlack: '\x1b[40m',
    BgRed: '\x1b[41m',
    BgGreen: '\x1b[42m',
    BgYellow: '\x1b[43m',
    BgBlue: '\x1b[44m',
    BgMagenta: '\x1b[45m',
    BgCyan: '\x1b[46m',
    BgWhite: '\x1b[47m'
}

function testColors(){
    Object.entries(COLORS).forEach(([prop, val]) => {
        console.log(val, "   "+prop+"   "+COLORS.Reset);
    });
}
//testColors();

const BQ = COLORS.Magenta+'❝'+COLORS.Reset;
const EQ = COLORS.Magenta+'❞'+COLORS.Reset;

const DEFAULT_SUITE = -1;

const SUPPRESS_IDENTIFIERS = [       // List of keywords and identifiers to suppress (can include regex patterns)
    'function', 'if', 'switch', 'case', 'while', 'for', 'return', 'typeof', 'isNaN'
];
const FRAMEWORK_FUNCTIONS = [       // List of more identifiers to suppress based on frameworks used (can include regex patterns)
    'alert', 'test', '$', 'rgb', 'makeSong' 
];

const FIND_FUNCTIONS =            /^(\s*(?:export\s+)?)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
const FIND_NON_EXPORT_FUNCTIONS = /^(\s*)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
const FIND_EXPORT_FUNCTIONS =     /^(\s*export\s+)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
const FIND_ALL_EXPORTS =          /^(\s*export\s+)\s*(const|var|let|class|default|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
const FIND_INVOCATIONS =          /(?<!\.|'|"|\b(?:export|const|var|let|class|default|function)\s+)\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
const FIND_INVOCATION_LINES =     /^((?<!\.|'|"|\b(?:export|const|var|let|class|default|function)\s+).*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\()/gm



const SUITES = [
    {     
        name: 'functions',
        regex: FIND_FUNCTIONS,
        description: '[export] function <function-name>',
        expression: '${match[1]}${match[2]} ${match[3]}',
        bareExpression:'${match[3]}' 
    },
    {     
        name: 'functions-no-exports',
        regex: FIND_NON_EXPORT_FUNCTIONS,
        description: 'function <function-name>',
        expression: '${match[1]}${match[2]} ${match[3]}',
        bareExpression:'${match[3]}' 
    },
    {   
        name: 'function-lines',
        regex: FIND_FUNCTIONS,
        description: 'Lines with functions in file',
        expression: BQ+'${match[0]}'+EQ,
        bareExpression:'${match[0]}' 
    },
    {   
        name: 'export-functions',
        regex: FIND_EXPORT_FUNCTIONS,
        description: 'export function <function-name>',
        expression: '${match[1]}${match[2]} ${match[3]}',
        bareExpression:'${match[3]}' 
    },
    {   
        name: 'exports',
        regex: FIND_ALL_EXPORTS,
        description: 'export (const|var|let|class|default|function) <function-name>',
        expression: '${match[1]}${match[2]} ${match[3]}',
        bareExpression:'${match[3]}' 
    },
    {   
        name: 'invocation-lines',
        regex: FIND_INVOCATION_LINES, 
        description: 'Find top-level invocations (whole line)',
        expression: BQ+'${match[0]}'+EQ,
        bareExpression:'${match[0]}',
        keywords: SUPPRESS_IDENTIFIERS
    },
    {   
        name: 'invocations',
        regex: FIND_INVOCATIONS,
        description: 'Find top-level invocations (noLang)',
        expression: BQ+'${match[0]}'+EQ,
        bareExpression:'${match[1]}',
        keywords: SUPPRESS_IDENTIFIERS,
        frameworkFunctions: []
    },
    {   
        name: 'invocations-no-frameworks',
        regex: FIND_INVOCATIONS,
        description: 'Find top-level invocations (noLang,noFrameworks)',
        expression: BQ+'${match[0]}'+EQ,
        bareExpression:'${match[1]}',
        keywords: SUPPRESS_IDENTIFIERS,
        frameworkFunctions: FRAMEWORK_FUNCTIONS
    }
];
function formatSuite(oneSuite, sIDx){
    return "Suite["+sIDx+"]:\n" + JSON.stringify(oneSuite, (key, value) =>
                value instanceof RegExp ? value.toString() : value, 4)
}




function colorANSI(aColor, str){
    if (options.color) {
        return aColor + str + COLORS.Reset;
    } else {
        return str;
    }
}

function testColors(){
    Object.entries(COLORS).forEach(([prop, val]) => {
        console.log(val, "   "+prop+"   "+COLORS.Reset);
    });
}
//testColors();

function printHelpBox(msg){
    console.log(colorANSI(COLORS.Cyan,"╔════════════════════════════════════════════════════════════════════════════"));
    console.log(colorANSI(COLORS.Cyan,"║     "+msg));
    console.log(colorANSI(COLORS.Cyan,"╚════════════════════════════════════════════════════════════════════════════"));
}
function printHelpDivider(){
    console.log(colorANSI(COLORS.Cyan,"═════════════════════════════════════════════════"));
}

function printSuites(){
        SUITES.forEach((oneSuite, sIDx) => {printInfo(formatSuite(oneSuite, sIDx))});
        //printHelpDivider();
}
function printInfo(str){
   console.log(colorANSI(COLORS.Bold+COLORS.Yellow,str)); 
}
function printError(str){
   console.log(colorANSI(COLORS.Bold+COLORS.Yellow,str)); 
}

function printSuiteNames(){
    SUITES.forEach((oneSuite) => {printInfo(oneSuite.name)});
}
function printSuiteNumbers(){
    SUITES.forEach((oneSuite, sIDx) => {printInfo(`${sIDx}: ${oneSuite.name}`)});
}

function printHelp(){
    console.log( colorANSI(COLORS.Bold+COLORS.Cyan,"Command-line options:\n"
            +"  --all                  :all lines, including duplicates.\n"
            +"  --bare      |  --b     :bare expressions without keywords\n"
            +"  --color     |  --c     :color output for DOS glory.\n"
            +"                            (Must be first arg if you want --help or suite listings in color.)\n"
            +"  --filenames |  --fi    :ouput filenames.\n"
            +"  --help      |  --h     :show this message and quit.\n"
            +"  --lines     |  --li    :output lines.\n"
            +"  --location  |  --lo    :output source character location.\n"
            +"  --quiet     |  --q     :no info messages\n"
            +"  --short     |  --sh    :short summaries, run with --summary too.\n"
            +"  --sort      |  --so    :sort lines.\n"
            +"  --summary   |  --sum   :output summary.\n"
            +"  --tests     |  --te    :print suites of tests and quit.\n"
            +"  --suites               :print suites of tests and quit.\n"
            +"  --suitenames           :print suites.name only and quit.\n"
            +"  --suitenumbers         :print [index]: suites[index].name and quit.\n"
            +"  --verbose   |  --v     :extra test information.\n"
            +"  --debug     |  --d     :extra debugging information.\n"
            +"\n"
            +"  --dir=/my/dir          :dir to run in [ /my/dir ], else run in the current directory.\n"
            +"  --ext='*.js,*.txt'     :extensions to run [ *.js,*.txt ].\n"
            +"  --suite=0              :which test suite to run, [ 0 ] in this case.\n"
            +"  --suite=functions      :which test suite to run, [ functions ] in this case.\n"
            )
        );
}

function writeConfigFile(writeConfigFilename, options){

}

function readConfig(configFilename){

}

const args = process.argv.slice(2);
let suiteIdx = DEFAULT_SUITE;
let extensions = ['.js', '.txt'];
let dir = process.cwd();
let singleFile = null;
let configFilename = null;

let options = {
    quit : false,
    quiet : false,
    color : false,
    bareExpressions : false,
    outputFilename : false,
    outputLines : false,
    outputSummary : false,   
    shortSummary : false,   
    outputSourceLocation : false,
    outputSortedLines : false,
    verbose: false,
    debug: false,
    configSource: "command-line",
    writeConfigFilename: null
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
                console.log('Please choose from the following, or run with --suites to see the full suite info:');
                printHelpDivider();
                printSuiteNames();
                process.exit(1);
            }
        }
    } else if (arg.startsWith('--ext=')) {
        extensions = arg.split('=')[1].split(',').map(e => e.startsWith('.') ? e : '.' + e);
    } else if (arg.startsWith('--dir=')) {
        dir = arg.split('=')[1];
    } else if (arg.startsWith('--runconfig=')) {
        configFilename = arg.split('=')[1];
        options.runconfigObj = readConfig(configFilename);
        if (!options.runconfigObj){
            logError("--runconfig= specified, but config not found");
            options.quit = true;
        } else {
            //TODO:  fix this conditional:
            let anyOtherArgs = "boolean: true if *any* other args are present.... ";
            if (anyOtherArgs){
                printError("Running with --runconfig= means no other options may be used. Exiting.");
                options.quit = true;
            }
            options.runconfigObj.configSource = configFilename;
        }
    } else if (arg.startsWith('--writeconfig=')) {
        configFilename = arg.split('=')[1];
        if (configFilename){
            printInfo("config file will be written: "+configFilename);
            options.writeConfigFilename = configFilename
        } else {
            logError("--writeconfig= specified, but no config filename was given.");
            config.quit = true;
        }
    } else if (arg.startsWith("--all")) {     //--all
        options.outputAll = true;
    } else if (arg.startsWith("--b")) {       //--bare
        options.bareExpressions = true;
    } else if (arg.startsWith("--c")) {       //--color
        options.color = true;
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
    } else if (arg.startsWith("--sh")) {      //--short (shortSummary)
        options.shortSummary = true;    
    } else if (arg.startsWith("--sum")) {     //--summary
        options.outputSummary = true;    
    } else if (arg.startsWith("--te")         //--tests
             ||arg.startsWith("--suites")) {  //--suites
        printSuites();
        options.quit = true;
    } else if (arg.startsWith("--suitenumbers")) { //--suitenumbers
        printSuiteNumbers();
        options.quit = true;
    } else if (arg.startsWith("--suitenames")) { //--suitenames
        printSuiteNames();
        options.quit = true;
    } else if (arg.startsWith("--v")) {       //--verbose
        options.verbose = true;
    } else if (arg.startsWith("--d")) {       //--debug
        options.debug = true;
    } else if (arg.startsWith("--h")) {       //--help
        printHelp();
        options.quit = true;
    }
});

if (options.quit){
    process.exit(1);
}

if (options.runconfig){
    options = options.runconfigObj;
} else if (options.writeConfigFilename){
    writeConfigFile(options.writeConfigFilename, options);
}

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

if (   suiteIdx == -1
    || !SUITES[suiteIdx] ) {
    function miniHelp(){
         console.error("Please run with the following options:"
            +"\n  --suites         (to see full suite info)"
            +"\n  --suitenames     (to see the bare list of suite names)"
            +"\n  --suitenumbers   (to see the list of suite numbers and names)"
            +"\n  For example run with:"
            +"\n    --suite=0"
            +"\n    --suite=functions"
            +"\n  or one of these other tests, shown by number and name:");
    }
    if (suiteIdx === -1) {
    
        console.error("No suite/test provided.");
        miniHelp();
    } else {
        console.error('Invalid suite index: '+suiteIdx);
        miniHelp();
    }
    
    printHelpDivider();
    printSuiteNumbers();
    printHelpDivider();
    process.exit(1);
}

const { regex, name, description, expression, bareExpression } = SUITES[suiteIdx];

const suite = SUITES[suiteIdx];

if (options.verbose){
    printHelpBox(`👉 Running suite[${suiteIdx}]`
                +`:${colorANSI(COLORS.Bold+COLORS.Red, name)} `
                +`  ${colorANSI(COLORS.Cyan, description)}`);
    console.log(`Directory: ${dir}`);
    if(singleFile){
        console.log(`Single file: ${singleFile}`);
    } else {
        console.log(`Extensions: ${extensions.join(', ')}`);
    }
    console.log("Suite:\n" + JSON.stringify(SUITES[suiteIdx], (key, value) =>
                value instanceof RegExp ? value.toString() : value, 4));
    console.log("Options:\n" + JSON.stringify(options,null,4));
    printHelpDivider()
} else if (options.quiet){
    //do nothing
} else {
    // not --quiet and not --verbose gets minimal
    printHelpBox(    "Suite: "+suiteIdx 
                    +"  "+ colorANSI(COLORS.Bold+COLORS.Red, name)
                    +"  "+ colorANSI(COLORS.Cyan, description) ); 

}


// --- Main logic ---

if (options.debug) console.log("\n********* Directory ************"+dir+"************\n");

readdir(dir, (err, files) => {
    if (options.debug) console.log("********* Files in Dir **********"+files+"\n*****************************************************\n");
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
    if (options.debug){
               console.log("********* Files for Processing*************"+targetFiles+"\n*****************************************************\n");
    }   
    if (options.verbose) {
        console.log("Files:" + targetFiles);
        printHelpDivider()
    }
    targetFiles.forEach(file => {
        if (options.debug) console.log("********* Processing ******"+file+"************");
        let state = new State();
        states.push(state);
        state.filename = file;
        state.suite = name;
        //const filePath = singleFile ? file : join(dir, file);
        const filePath = join(dir, file);
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
                let theExpression;
                if (options.bareExpressions){
                    theExpression = bareExpression;
                } else {
                    theExpression = expression;
                }
                if (theExpression) {
                    const output = theExpression.replace(/\$\{match\[(\d+)\]\}/g, (m, idx) => match[idx] || '');
                    const startIndex = regex.lastIndex - match[0].length;
                    const upToMatch = content.slice(0, startIndex);  // Count lines up to startIndex
                    const lineNumber = upToMatch.split('\n').length;
                    state.addLine(output.trim(), lineNumber, startIndex, options.outputAll);
                }
            }
        }
        state.foundEnd();
    });
    states.forEach(theState => {
        if (theState.quantifyFound()>0){
            if (options.outputLines){
                if (options.outputFilename){
                    console.log("\n\n💾 ━━━━━━━━━━━━━━━━━━  file: "+theState.printFilename() + "  ━━━━━━━━━━━━━━━━━━━━━\n");
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
                console.log("\n\n━━━━━━━━   "+colorANSI(COLORS.Green,"🗍")+"   None found in these files ━━━━━━━━━━━━━━━━━━━━━━━━");
                notFoundHeaderPrinted = true;
            }
            console.log(theState.printFilename());
        }
    });
    if (notFoundHeaderPrinted){
        console.log(             "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
    console.log("");
});

class State {
    #foundBegin = false;
    #foundEnd = false;
    #lines = [];
    #lineSet = new Set();
    filename = "";
    suite = "";
    
    addLine(line, linenum, startIndex, all) {
        if (all || !this.#lineSet.has(line)) {
            //let rawLine = ""; //TODO: have the caller send in the full line.
            //let replacedLine = "";
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
                    suite: this.suite,
                    filename: this.filename,
                    quantifyFound: this.#lines.length,
                    lines: this.#lines
            };
        } else {
            if (options.shortSummary){
                return {
                    suite: this.suite,
                    filename: this.filename,
                    quantifyFound: this.#lines.length                    
                }
            } else {
                return {
                    suite: this.suite,
                    filename: this.filename,
                    quantifyFound: this.#lines.length,
                    lines: this.#lines.map(obj => obj.line)
                }
            }
        }
    }
    
}
