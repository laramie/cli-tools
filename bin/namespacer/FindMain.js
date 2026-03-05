#!/usr/bin/env node

/* Node.js utility to search files in a directory with regex suites
    Run on the bash command line like so, since ths file has a shebang.
        cd ~/infinite-neck
        ./bin/namespacer/FindMain.js --h
    e.g.
        laramie@penguin:~/infinite-neck$ ./bin/namespacer/FindMain --h
*/


import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import { fileURLToPath } from 'url';
import { FindOptions } from './FindOptions.js';
import { SourceLines } from './SourceLines.js';
import { ANSIColors } from './ANSIColors.js';
import { RegexSuites} from './RegexSuites.js';

/** This class is driven from command-line parameters and files or globs passed to 
 *   process a number of source Javascript files, scanning for functions, exports, and invocations.
 *   It writes out an accumulation of things it has done in the accumulator,
 *   and print out many different things on stdout based on options.  So you can use
 *   it to do grep-like work, making it quiet and printing out bare lists of functions found, identifiers found, etc.,
 *   or you can run in verbose and see lots of information on stdout.
 *   You can run it with test-FindMain.bash in the same directory.
 *   It is designed to precede in the shell (or call in Node.js/Javascript) :      
 *             Replacer.js
 *   Along the way, that module can call to generate Javascript classes to act as Facade Interfaces:
 *             GenerateInterface.js
 */
export class FindMain {
    constructor() {
        this.planAccumulator = [];
    }

    main(){
        let regexSuites = new RegexSuites();

        const args = process.argv.slice(2);
        let options = new FindOptions();
        options.dir = process.cwd();
        let quit = options.processArgs(args, regexSuites, this/*printer*/);

        if (quit){
            process.exit(1);
        }
        
        console.log(""); 
        let prePlanActions = [];
        
        if (options.runconfig){
            //there are other reasons to quit above, but this also causes a quit.
            let flatOptionsObj = null;
            if (options.configFilename){
                flatOptionsObj = this.readConfigIntoFindOptionsObject(options.configFilename);
                if (!flatOptionsObj){
                    this.printError(options, "--runconfig= specified, but config not found");
                    process.exit(1);  
                } 
                options = new FindOptions(flatOptionsObj);
            } else {
                this.printError(options, "--runconfig= specified, but options.configFilename was not set.");//programming error, not user error.
                process.exit(1); 
            }    
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
                prePlanActions.push("💾 writeConfigFile: "+options.writeConfigFilename); 
            }
        }
        this.runWithOptions(options, regexSuites, prePlanActions);
    }

    runWithNamedOptionsFile(configFilename, regexSuites, prePlanActions){
        let options = this.readConfigIntoFindOptionsObject(configFilename);
        if (!options){
            this.printError(options, "--runconfig= specified, but config not found");
            process.exit(1);  
        } 
        if (!options.dir){
            options.dir = process.cwd();   
        }
        this.runWithOptions(options, regexSuites, prePlanActions);
    }

    runWithOptions(options, regexSuites, prePlanActions){
        if (options.debug) console.log("options:"+JSON.stringify(options));

        this.planAccumulator.push("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                                +"\nAccumulated Plan. Run: "+options.colorANSI(ANSIColors.Cyan, FindMain.getTimeStamp(true))
                                +(options.color 
                                    ?   "\n  --color :: View as 'cat <filename>' or 'less -R <filename>'"
                                    :  ""
                                )
                                +"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        if (prePlanActions){
            this.planAccumulator.push(...prePlanActions);
        }

        if (options.outputLines == false && options.outputFilename == false){
            options.outputSummary = true;
        }

        if (   options.suiteIdx == -1
            || !regexSuites.getSuites()[options.suiteIdx] ) {
            
            if (options.suiteIdx === -1) {
            
                console.error("No suite/test provided:"+options.suiteIdx);
                options.miniHelp();
            } else {
                console.error('Invalid suite index: '+options.suiteIdx);
                options.miniHelp();
            }
            this.printHelpDivider(options);
            regexSuites.printSuiteNumbers(options, this/*printer*/);
            this.printHelpDivider(options);
            process.exit(1);
        }

        const { regex, name, description, expression, bareExpression } = regexSuites.getSuites()[options.suiteIdx];

        const suite = regexSuites.getSuites()[options.suiteIdx];

        let loglineRunning = (`🌐  Running suite[${options.suiteIdx}]`
                        +`:${options.colorANSI(ANSIColors.Bold+ANSIColors.Red, name)} `
                        +`  ${options.colorANSI(ANSIColors.Cyan, description)}`);
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
            this.accumulatePlan(loglineSuite);
            console.log(this.accumulatePlan("Options:\n" + JSON.stringify(options,null,4)));
            this.printHelpDivider(options)
        } else if (options.quiet){
            //do nothing
        } else {
            // not --quiet and not --verbose gets minimal
            let loglineMinimalSuite = "Suite: "+options.suiteIdx 
                                        +"  "+ options.colorANSI(ANSIColors.Bold+ANSIColors.Red, name)
                                        +"  "+ options.colorANSI(ANSIColors.Cyan, description) ; 
            this.printHelpBox(options, loglineMinimalSuite);
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
                this.accumulatePlan("FindMain processing file: "+options.colorANSI(ANSIColors.Yellow,file));

                //TODO:suppressList moved from inside while match....
                    let suppressList = [];
                    if (suite.keywords && Array.isArray(suite.keywords)) {
                        suppressList = suppressList.concat(suite.keywords);
                    }
                    if (suite.frameworkFunctions && Array.isArray(suite.frameworkFunctions)) {
                        suppressList = suppressList.concat(suite.frameworkFunctions);
                    }
                    /** Load per-file suppressions and add them */
                    const perFileSuppressions = this.loadFrameworkSuppressionsForFile(file, options.datadir);
                    if (perFileSuppressions.length > 0) {
                        console.log("**************************** found suppressions for file<"+file+">: ["+perFileSuppressions+"]");
                        suppressList = suppressList.concat(perFileSuppressions);
                    }
                    //END TODO:suppressList moved ...

                let state = new SourceLines();
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
                        this.accumulatePlan("👉 Summary: "+theState.filename+" :: "+theState.quantifyFound());
                    }
                }
            });
            let notFoundHeaderPrinted = false;
            states.forEach(theState => {
                if (theState.quantifyFound()===0 && options.outputFilename){
                    if (!notFoundHeaderPrinted){
                        let loglineNone = "\n\n━━━━━━━━   "+options.colorANSI(ANSIColors.Green,"🗍")+"   None found in these files ━━━━━━━━━━━━━━━━━━━━━━━━";
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
        this.appendOutputFile(join(options.datadir+"/plans","accumulator.plan"),this.getAccumulatorPrintout(options), options);
        console.log(""); 
    } //END main();



        

    // Helper to load per-file suppressions from a plan file
    loadFrameworkSuppressionsForFile(sourceFilename, datadir = "data") {
        const planFile = join(datadir, "plans", basename(sourceFilename) + ".frameworks.plan");
        if (!existsSync(planFile)) return [];
        const lines = readFileSync(planFile, 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
        return lines;
    }
                            
    readConfigIntoFindOptionsObject(configFilename){
        let options = null;
        let flatOptionsObj = null;
        if (configFilename){
            flatOptionsObj = this.readConfig(null, configFilename);  //TODO: using printer as a ref to FindMain is really weird.  Fix this.
            if (!flatOptionsObj){
                this.printError(null, "--runconfig= specified, but config not found");
            } 
            options = new FindOptions(flatOptionsObj);
        } 
        return options;
    }





    readConfig(options, configFilename){
        try {
            if (!existsSync(configFilename)) {
                this.printError(options, `Config file not found: ${configFilename}`);
                return null;
            }
            const data = readFileSync(configFilename, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            this.printError(options, `Error reading config file: ${err}`);
            return null;
        }
    }

    writeConfigFile(writeConfigFilename, options){
        try {
            // Remove any non-serializable or runtime-only properties
            const toWrite = { ...options };
            // Remove properties that shouldn't be saved
            delete toWrite.writeConfigFilename;
            delete toWrite.runconfig;
            delete toWrite.configFilename;
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
            this.printError(options, `Error writing config file: ${err}`);
        }
    }

    accumulatePlan(logline){
        this.planAccumulator.push(logline);
        return logline;
    }
    
    static getTimeStamp(emitSeconds){
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
        const timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes())  +':'+ (emitSeconds ? pad(now.getSeconds()) : "");
        const dateTimeStr = dateStr + ' ' + timeStr;
        return dateTimeStr;  
    }
    
    getAccumulatorPrintout(options){
        return this.planAccumulator.join("\n")
                    +"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    +"\n" + options.colorANSI(ANSIColors.Green, FindMain.getTimeStamp(true))
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

    //   \uD83D\uDCBE == 💾
    appendOutputFile(relPath, data, options){
        let logline = "💾  ━━━━━━━━━━━━━━━━━━ File appended: "+relPath+" ━━━━━━━━━━━━━━━━━━";
        if (!options.quiet){
            console.log("\n"+logline);
        }
        writeFileSync(relPath, data, { encoding: 'utf8', flag: 'a' });
        this.accumulatePlan(logline);
    }


    printHelpBox(options, msg){
        console.log(options.colorANSI(ANSIColors.Cyan,"╔════════════════════════════════════════════════════════════════════════════"));
        console.log(options.colorANSI(ANSIColors.Cyan,"║     "+msg));
        console.log(options.colorANSI(ANSIColors.Cyan,"╚════════════════════════════════════════════════════════════════════════════"));
    }

    printHelpDivider(options){
        console.log(options.colorANSI(ANSIColors.Cyan,"═════════════════════════════════════════════════"));
    }

    printInfo(options, str){
        console.log(options.colorANSI(ANSIColors.Bold+ANSIColors.Yellow,str)); 
    }

    printError(options, str){
        if (options){
            console.error(options.colorANSI(ANSIColors.Bold+ANSIColors.Yellow,str));
        } else {
            console.error(str);
        }
    }

    static test(){
        let state = new SourceLines();
        state.test();
    }
}



if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  // This file is being run directly
  new FindMain().main();
}
