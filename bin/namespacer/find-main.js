#!/usr/bin/env node

/* Node.js utility to search files in a directory with regex suites
    Run on the bash command line like so, since ths file has a shebang.
        cd ~/infinite-neck
        ./bin/find-js-dependencies.js --h
    e.g.
        laramie@penguin:~/infinite-neck$ ./bin/find-js-dependencies.js --h
*/


import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { FindOptions } from './find-options.js';
import { State } from './find-state.js';
import { Colors } from './colors.js';
import { FindSuites} from './find-suites.js';

export class FindMain {
    constructor() {
        this.colors = new Colors();
        this.suites = new FindSuites();
        this.state = new State();
        this.options = new FindOptions();
        this.planAccumulator = [];
    }

    
    

    main(){
        this.planAccumulator.push("This is the accumulated Plan of what this program is producing."
                        +"\n  It is produced with ANSI escape sequences.  Run without --color to suppress,"
                        +"\n  or view it with an ANSI viewer, such as 'cat <filename>' to an ANSI terminal, "
                        +"\n  or 'less -R <filename>'");

        const args = process.argv.slice(2);

        let options = new FindOptions();

        options.dir = process.cwd();

        let quit = false;

        args.forEach(arg => {
            if (arg.startsWith('--suite=')) {
                let suiteArg = arg.split('=')[1];
                // Try integer first
                let idx = Number(suiteArg);
                if (Number.isInteger(idx) && idx >= 0 && idx < FindSuites.SUITES.length) {
                    options.suiteIdx = idx;
                } else {
                    // Only allow hyphenated identifiers, ignore spaces in FindSuites.SUITES.name
                    let foundIdx = FindSuites.SUITES.findIndex(suite => suite.name.replace(/\s+/g, '') === suiteArg);
                    if (foundIdx !== -1) {
                        options.suiteIdx = foundIdx;
                        options.suite = FindSuites.SUITES[options.suiteIdx].name;
                    } else {
                        console.error('Invalid suite identifier: ' + suiteArg);
                        console.log('Please choose from the following, or run with --suites to see the full suite info:');
                        printHelpDivider();
                        printSuiteNames();
                        quit = true;
                    }
                }
            } else if (arg.startsWith('--ext=')) {
                options.extensions = arg.split('=')[1].split(',').map(e => e.startsWith('.') ? e : '.' + e);
            } else if (arg.startsWith('--dir=')) {
                options.dir = arg.split('=')[1];
                options.dirSpecified = true;
            } else if (arg.startsWith('--datadir=')) {
                options.datadir = arg.split('=')[1];
                options.datadirSpecified = true;
            } else if (arg.startsWith('--runconfig=')) {
                let configFilename = arg.split('=')[1];
                options.runconfigObj = readConfig(configFilename);
                if (!options.runconfigObj){
                    printError("--runconfig= specified, but config not found");
                    quit = true;
                } else {
                    // Only allow --runconfig, no other options
                    let otherArgs = args.filter(a => !a.startsWith('--runconfig='));
                    let anyOtherArgs = otherArgs.length > 0;
                    if (anyOtherArgs){
                        printError("Running with --runconfig= means no other options may be used. Exiting.");
                        quit = true;
                    }
                    options.runconfigObj.configSource = configFilename;
                    options.runconfig = true;
                    quit = false; //all configs come from file.  Ignore any other bugaboos.
                }
            } else if (arg.startsWith('--writeconfig=')) {
                let configFilename = arg.split('=')[1];
                if (configFilename){
                    if (options.debug) printInfo("config file will be written: "+configFilename);
                    options.writeConfigFilename = configFilename
                } else {
                    printError("--writeconfig= specified, but no config filename was given.");
                    quit = true;
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
                quit = true;
            } else if (arg.startsWith("--suitenumbers")) { //--suitenumbers
                printSuiteNumbers();
                quit = true;
            } else if (arg.startsWith("--suitenames")) { //--suitenames
                printSuiteNames();
                quit = true;
            } else if (arg.startsWith("--v")) {       //--verbose
                options.verbose = true;
            } else if (arg.startsWith("--d")) {       //--debug
                options.debug = true;
            } else if (arg.startsWith("--h")) {       //--help
                printHelp();
                quit = true;
            }
        });

        if (quit){
            process.exit(1);
        }

        if (options.runconfig){
            options = options.runconfigObj;
        } else {
            // If the last argument is not an option, treat it as a filename
            if (args.length > 0) {
                const lastArg = args[args.length - 1];
                if (!lastArg.startsWith('--')) {
                    options.singleFile = lastArg;
                }
            }
            if (options.writeConfigFilename){
                writeConfigFile(options.writeConfigFilename, options);
                accumulatePlan("💾 writeConfigFile: "+options.writeConfigFilename); 
            }
        }

        if (options.outputLines == false && options.outputFilename == false){
            options.outputSummary = true;
        }



        if (   options.suiteIdx == -1
            || !FindSuites.SUITES[options.suiteIdx] ) {
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
            if (options.suiteIdx === -1) {
            
                console.error("No suite/test provided:"+options.suiteIdx);
                miniHelp();
            } else {
                console.error('Invalid suite index: '+options.suiteIdx);
                miniHelp();
            }
            
            printHelpDivider();
            printSuiteNumbers();
            printHelpDivider();
            process.exit(1);
        }

        const { regex, name, description, expression, bareExpression } = FindSuites.SUITES[options.suiteIdx];

        const suite = FindSuites.SUITES[options.suiteIdx];


        let loglineRunning = (`👉 Running suite[${options.suiteIdx}]`
                        +`:${colorANSI(Colors.Bold+Colors.Red, name)} `
                        +`  ${colorANSI(Colors.Cyan, description)}`);
        accumulatePlan(loglineRunning);
        let loglineDirectory= `Directory: ${options.dir}`;
        accumulatePlan(loglineRunning);
        let loglineFiles;
        if(options.singleFile){
            loglineFiles = `Single file: ${options.singleFile}`;
        } else {
            loglineFiles = `Extensions: ${options.extensions.join(', ')}`;
        }
        accumulatePlan(loglineFiles);
        let loglineSuite = "Suite:\n" + JSON.stringify(FindSuites.SUITES[options.suiteIdx], (key, value) =>
                        value instanceof RegExp ? value.toString() : value, 4);
        accumulatePlan(loglineSuite);

                    
                
        if (options.verbose){
            printHelpBox(loglineRunning);
            console.log(loglineDirectory);
            console.log(loglineFiles);
            console.log(loglineSuite);
            console.log(accumulatePlan("Options:\n" + JSON.stringify(options,null,4)));
            printHelpDivider()
        } else if (options.quiet){
            //do nothing
        } else {
            // not --quiet and not --verbose gets minimal
            printHelpBox(    "Suite: "+options.suiteIdx 
                            +"  "+ colorANSI(Colors.Bold+Colors.Red, name)
                            +"  "+ colorANSI(Colors.Cyan, description) ); 

        }

        // --- Main logic ---

        if (options.debug) console.log("\n********* Directory ************"+options.dir+"************\n");

        let files;
        let filesExeption = false;
        try {
            files = readdirSync(options.dir);
        } catch (error){
            filesExeption = true;
            console.error("Error reading directory [readdirSync] failed: "+error);
            process.exit(1);
        }
        if (!filesExeption){
            if (options.debug) console.log("********* Files in Dir **********"+files+"\n*****************************************************\n");
            const states = [];
            let targetFiles;
            if (options.singleFile) {
                targetFiles = [options.singleFile];
            } else {
                targetFiles = files.filter(file => options.extensions.includes(extname(file)));
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
                accumulatePlan("Processing file: "+file);
                let state = new State();
                states.push(state);
                state.filename = file;
                state.suite = name;
                const filePath = join(options.dir, file);
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
                        if (options.outputFilename){              //   💾 📂 📄  🗒  📜 📃 ▤
                            console.log("\n\n📄 ━━━━━━━━━━━━━━━━━━  file: "+theState.printFilename() + "  ━━━━━━━━━━━━━━━━━━━━━\n");
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
                        let loglineNone1 = "\n\n━━━━━━━━   "+colorANSI(Colors.Green,"🗍")+"   None found in these files ━━━━━━━━━━━━━━━━━━━━━━━━";
                        console.log(loglineNone1);
                        accumulatePlan(loglineNone1);
                        notFoundHeaderPrinted = true;
                    }
                    console.log(theState.printFilename());
                    accumulatePlan("None found in file: "+theState.printFilename());
                }
            });
            if (notFoundHeaderPrinted){
                console.log(             "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            }
            console.log("");
        }
        writeOutputFile(join(options.datadir+"/plans","accumulator.plan"),getAccumulatorPrintout()); 
    } //END main();

    readConfig(configFilename){
        try {
            if (!existsSync(configFilename)) {
                printError(`Config file not found: ${configFilename}`);
                return null;
            }
            const data = readFileSync(configFilename, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            printError(`Error reading config file: ${err}`);
            return null;
        }
    }


    writeConfigFile(writeConfigFilename, options){
        try {
            // Remove any non-serializable or runtime-only properties
            const toWrite = { ...options };
            // Remove properties that shouldn't be saved
            delete toWrite.writeConfigFilename;
            delete toWrite.runconfigObj;
            delete toWrite.runconfig;
            if (!options.dirSpecified){
                delete toWrite.dir;
                delete toWrite.dirSpecified;
            }
            if (!options.datadirSpecified){
                delete toWrite.datadir;
                delete toWrite.datadirSpecified;
            }
            // Write as pretty JSON
            writeFileSync(writeConfigFilename, JSON.stringify(toWrite, null, 4), 'utf8');
            if (!options.quiet) printInfo(`Config written to ${writeConfigFilename}`);
        } catch (err) {
            printError(`Error writing config file: ${err}`);
        }
    }

    

    accumulatePlan(logline){
        planAccumulator.push(logline);
        return logline;
    }
    getAccumulatorPrintout(){
        return planAccumulator.join("\n");
    }

    writeOutputFile(relPath, data){
        let logline = "💾  ━━━━━━━━━━━━━━━━━━ File written: "+relPath+" ━━━━━━━━━━━━━━━━━━";
        if (!options.quiet){
            console.log("\n"+logline);
        }
        writeFileSync(relPath, data, 'utf8');
        accumulatePlan(logline);
    }

    colorANSI(aColor, str){
        if (options.color) {
            return aColor + str + Colors.Reset;
        } else {
            return str;
        }
    }



    printHelpBox(msg){
        console.log(colorANSI(Colors.Cyan,"╔════════════════════════════════════════════════════════════════════════════"));
        console.log(colorANSI(Colors.Cyan,"║     "+msg));
        console.log(colorANSI(Colors.Cyan,"╚════════════════════════════════════════════════════════════════════════════"));
    }
    printHelpDivider(){
        console.log(colorANSI(Colors.Cyan,"═════════════════════════════════════════════════"));
    }

    printSuites(){
            FindSuites.SUITES.forEach((oneSuite, sIDx) => {printInfo(formatSuite(oneSuite, sIDx))});
            //printHelpDivider();
    }
    printInfo(str){
    console.log(colorANSI(Colors.Bold+Colors.Yellow,str)); 
    }
    printError(str){
    console.log(colorANSI(Colors.Bold+Colors.Yellow,str)); 
    }

    printSuiteNames(){
        FindSuites.SUITES.forEach((oneSuite) => {printInfo(oneSuite.name)});
    }
    printSuiteNumbers(){
        FindSuites.SUITES.forEach((oneSuite, sIDx) => {printInfo(`${sIDx}: ${oneSuite.name}`)});
    }

    printHelp(){
        console.log( colorANSI(Colors.Bold+Colors.Cyan,"Command-line options:\n"
            +"  --all                  :all lines, including duplicates.\n"
            +"  --bare      |  --b     :bare expressions without keywords\n"
            +"  --color     |  --c     :color output for DOS glory.\n"
            +"                            (Must be first arg if you want --help or suite listings in color.)\n"
            +"  --debug     |  --d     :extra debugging information.\n"
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
            +"\n"
            +"  --datadir=my/data     :datadir to write to [ my/data ], else use current directory.\n"
            +"                            Default: [ data ]     Relative or absolute path allowed.\n"
            +"                            Within that dir, tmp/ out/ plans/ are assumed to exist.\n"
            +"                            Best practice: ensure these exist: data/tmp/ data/out/ data/plans/\n"
            +"  --dir=my/dir          :dir to run in  [ my/dir ], else run in the current directory.\n"
            +"                            Default: [ ./ ]       Relative or absolute path allowed.\n"
            +"                            Best practice: [ data/src ] \n"
            +"  --ext='*.js,*.txt'     :extensions to run [ *.js,*.txt ].\n"
            +"  --writeconfig=path     :path/to/file.json to write options used.\n"
            +"  --runconfig=path       :path/to/file.json to use all options from.\n"
            +"                            [exclusive, no other args allowed]\n"
            +"  --suite=0              :which test suite to run, [ 0 ] in this case.\n"
            +"  --suite=functions      :which test suite to run, [ functions ] in this case.\n"
            )
        );
    }



    static test(){
        let state = new State();
        state.test();
    }
}

new FindMain().main();
