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
import { RegexSuites} from './regex-suites.js';

export class FindMain {
    constructor() {
        this.planAccumulator = [];
    }

    main(){
        this.planAccumulator.push("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                        +"\nThis is the accumulated Plan of what this program is producing."
                        +"\n  When run with --color it produces ANSI escape sequences."
                        +"\n  View as 'cat <filename>' to an ANSI terminal, or 'less -R <filename>'"
                        +"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        let regexSuites = new RegexSuites();

        const args = process.argv.slice(2);
        let options = new FindOptions();
        options.dir = process.cwd();
        let quit = options.processArgs(args, regexSuites, this/*printer*/);

        if (quit){
            process.exit(1);
        }

        console.log(""); 
        
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
                this.writeConfigFile(options.writeConfigFilename, options);
                this.accumulatePlan("💾 writeConfigFile: "+options.writeConfigFilename); 
            }
        }

        if (options.outputLines == false && options.outputFilename == false){
            options.outputSummary = true;
        }

        if (   options.suiteIdx == -1
            || !regexSuites.getSuites()[options.suiteIdx] ) {
            
            if (options.suiteIdx === -1) {
            
                console.error("No suite/test provided:"+options.suiteIdx);
                miniHelp();
            } else {
                console.error('Invalid suite index: '+options.suiteIdx);
                options.miniHelp();
            }
            
            this.printHelpDivider(options);
            this.printSuiteNumbers();
            this.printHelpDivider(options);
            process.exit(1);
        }

        const { regex, name, description, expression, bareExpression } = regexSuites.getSuites()[options.suiteIdx];

        const suite = regexSuites.getSuites()[options.suiteIdx];

        let loglineRunning = (`👉 Running suite[${options.suiteIdx}]`
                        +`:${options.colorANSI(Colors.Bold+Colors.Red, name)} `
                        +`  ${options.colorANSI(Colors.Cyan, description)}`);
        this.accumulatePlan(loglineRunning);
        let loglineDirectory= `Directory: ${options.dir}`;
        this.accumulatePlan(loglineDirectory);
        let loglineFiles;
        if(options.singleFile){
            loglineFiles = `Single file: ${options.singleFile}`;
        } else {
            loglineFiles = `Extensions: ${options.extensions.join(', ')}`;
        }
        this.accumulatePlan(loglineFiles);
        let loglineSuite = "Suite:\n" + JSON.stringify(regexSuites.getSuites()[options.suiteIdx], (key, value) =>
                        value instanceof RegExp ? value.toString() : value, 4);
        

                    
                
        if (options.verbose){
            this.printHelpBox(options, loglineRunning);
            console.log(loglineDirectory);
            console.log(loglineFiles);
            console.log(loglineSuite);
            this.accumulatePlan("verbose: "+loglineSuite);
            console.log(this.accumulatePlan("Options:\n" + JSON.stringify(options,null,4)));
            this.printHelpDivider(options)
        } else if (options.quiet){
            //do nothing
        } else {
            // not --quiet and not --verbose gets minimal
            this.printHelpBox(options,     "Suite: "+options.suiteIdx 
                            +"  "+ options.colorANSI(Colors.Bold+Colors.Red, name)
                            +"  "+ options.colorANSI(Colors.Cyan, description) ); 
            this.accumulatePlan("default verbosity: "+loglineSuite);

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
                this.printHelpDivider(options)
            }
            targetFiles.forEach(file => {
                if (options.debug) console.log("********* Processing ******"+file+"************");
                this.accumulatePlan("Processing file: "+file);
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
                        let loglineNone = "\n\n━━━━━━━━   "+options.colorANSI(Colors.Green,"🗍")+"   None found in these files ━━━━━━━━━━━━━━━━━━━━━━━━";
                        console.log(loglineNone);
                        this.accumulatePlan(loglineNone);
                        notFoundHeaderPrinted = true;
                    }
                    console.log(theState.printFilename());
                    this.accumulatePlan("None found in file: "+theState.printFilename());
                }
            });
            if (notFoundHeaderPrinted){
                console.log(             "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            }
            console.log("");
        }
        this.writeOutputFile(join(options.datadir+"/plans","accumulator.plan"),this.getAccumulatorPrintout(), options);
        console.log(""); 
    } //END main();

    readConfig(configFilename){
        try {
            if (!existsSync(configFilename)) {
                printError(options, `Config file not found: ${configFilename}`);
                return null;
            }
            const data = readFileSync(configFilename, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            printError(options, `Error reading config file: ${err}`);
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
            if (!options.quiet) this.printInfo(options, `Config written to ${writeConfigFilename}`);
        } catch (err) {
            printError(options, `Error writing config file: ${err}`);
        }
    }

    

    accumulatePlan(logline){
        this.planAccumulator.push(logline);
        return logline;
    }
    getAccumulatorPrintout(){
        return this.planAccumulator.join("\n")
        +"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        +"\n\n";
    }

    writeOutputFile(relPath, data, options){
        let logline = "💾  ━━━━━━━━━━━━━━━━━━ File written: "+relPath+" ━━━━━━━━━━━━━━━━━━";
        if (!options.quiet){
            console.log("\n"+logline);
        }
        writeFileSync(relPath, data, 'utf8');
        this.accumulatePlan(logline);
    }

    


    printHelpBox(options, msg){
        console.log(options.colorANSI(Colors.Cyan,"╔════════════════════════════════════════════════════════════════════════════"));
        console.log(options.colorANSI(Colors.Cyan,"║     "+msg));
        console.log(options.colorANSI(Colors.Cyan,"╚════════════════════════════════════════════════════════════════════════════"));
    }
    printHelpDivider(options){
        console.log(options.colorANSI(Colors.Cyan,"═════════════════════════════════════════════════"));
    }

   
    printInfo(options, str){
        console.log(options.colorANSI(Colors.Bold+Colors.Yellow,str)); 
    }
    printError(options, str){
        console.log(options.colorANSI(Colors.Bold+Colors.Yellow,str)); 
    }

    printSuiteNames(){
        regexSuites.getSuites().forEach((oneSuite) => {this.printInfo(options, oneSuite.name)});
    }
    printSuiteNumbers(){
        regexSuites.getSuites().forEach((oneSuite, sIDx) => {this.printInfo(options, `${sIDx}: ${oneSuite.name}`)});
    }

    



    static test(){
        let state = new State();
        state.test();
    }
}

new FindMain().main();
