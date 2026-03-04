import { Colors } from './colors.js';
import { RegexSuites} from './regex-suites.js';

export class FindOptions {
    constructor() {
        this.quiet = false;
        this.color = false;
        this.bareExpressions = false;
        this.outputFilename = false;
        this.outputLines = false;
        this.outputSummary = false;
        this.shortSummary = false;
        this.outputSourceLocation = false;
        this.outputSortedLines = false;
        this.verbose = false;
        this.debug = false;
        this.configSource = "command-line";
        this.writeConfigFilename = null;
        this.suiteIdx = typeof FindOptions.DEFAULT_SUITE !== 'undefined' ? FindOptions.DEFAULT_SUITE : 0;
        this.extensions = ['.js', '.txt'];
        this.singleFile = null;
        this.configFilename = null;
        this.dir = "";
        this.dirSpecified = false;
        this.datadir = "data";
        this.datadirSpecified = false;
    }
    static DEFAULT_SUITE = -1;

    processArgs(args, regexSuites, printer){
        let quit = false;
        args.forEach(arg => {
            if (arg.startsWith('--suite=')) {
                let suiteArg = arg.split('=')[1];
                // Try integer first
                let idx = Number(suiteArg);
                if (Number.isInteger(idx) && idx >= 0 && idx < regexSuites.getSuites().length) {
                    this.suiteIdx = idx;
                } else {
                    // Only allow hyphenated identifiers, ignore spaces in regexSuites.getSuites().name
                    let foundIdx = regexSuites.getSuites().findIndex(suite => suite.name.replace(/\s+/g, '') === suiteArg);
                    if (foundIdx !== -1) {
                        this.suiteIdx = foundIdx;
                        this.suite = regexSuites.getSuites()[this.suiteIdx].name;
                    } else {
                        console.error('Invalid suite identifier: ' + suiteArg);
                        console.log('Please choose from the following, or run with --suites to see the full suite info:');
                        this.printHelpDivider(options);
                        this.printSuiteNames();
                        quit = true;
                    }
                }
            } else if (arg.startsWith('--ext=')) {
                this.extensions = arg.split('=')[1].split(',').map(e => e.startsWith('.') ? e : '.' + e);
            } else if (arg.startsWith('--dir=')) {
                this.dir = arg.split('=')[1];
                this.dirSpecified = true;
            } else if (arg.startsWith('--datadir=')) {
                this.datadir = arg.split('=')[1];
                this.datadirSpecified = true;
            } else if (arg.startsWith('--runconfig=')) {
                let configFilename = arg.split('=')[1];
                this.runconfigObj = readConfig(configFilename);
                if (!this.runconfigObj){
                    this.printError(options, "--runconfig= specified, but config not found");
                    quit = true;
                } else {
                    // Only allow --runconfig, no other options
                    let otherArgs = args.filter(a => !a.startsWith('--runconfig='));
                    let anyOtherArgs = otherArgs.length > 0;
                    if (anyOtherArgs){
                        this.printError(options, "Running with --runconfig= means no other options may be used. Exiting.");
                        quit = true;
                    }
                    this.runconfigObj.configSource = configFilename;
                    this.runconfig = true;
                    quit = false; //all configs come from file.  Ignore any other bugaboos.
                }
            } else if (arg.startsWith('--writeconfig=')) {
                let configFilename = arg.split('=')[1];
                if (configFilename){
                    if (this.debug) this.this.printInfo(options, "config file will be written: "+configFilename);
                    this.writeConfigFilename = configFilename
                } else {
                    this.printError(options, "--writeconfig= specified, but no config filename was given.");
                    quit = true;
                }
            } else if (arg.startsWith("--all")) {     //--all
                this.outputAll = true;
            } else if (arg.startsWith("--b")) {       //--bare
                this.bareExpressions = true;
            } else if (arg.startsWith("--c")) {       //--color
                this.color = true;
        } else if (arg.startsWith("--fi")) {      //--filenames
                this.outputFilename = true;
            } else if (arg.startsWith("--li")) {      //--lines
                this.outputLines = true;
            } else if (arg.startsWith("--lo")) {      //--location
                this.outputSourceLocation = true;
            } else if (arg.startsWith("--q")) {       //--quiet
                this.quiet = true;
            } else if (arg.startsWith("--so")) {      //--sort
                this.outputSortedLines = true;    
            } else if (arg.startsWith("--sh")) {      //--short (shortSummary)
                this.shortSummary = true;    
            } else if (arg.startsWith("--sum")) {     //--summary
                this.outputSummary = true;    
            } else if (arg.startsWith("--te")         //--tests
                    ||arg.startsWith("--suites")) {  //--suites
                regexSuites.printSuites(this,printer);
                quit = true;
            } else if (arg.startsWith("--suitenumbers")) { //--suitenumbers
                this.printSuiteNumbers();
                quit = true;
            } else if (arg.startsWith("--suitenames")) { //--suitenames
                this.printSuiteNames();
                quit = true;
            } else if (arg.startsWith("--v")) {       //--verbose
                this.verbose = true;
            } else if (arg.startsWith("--d")) {       //--debug
                this.debug = true;
            } else if (arg.startsWith("--h")) {       //--help
                this.printHelp();
                quit = true;
            }
        });
        return quit;
    }

    miniHelp(){
        console.error("Please run with the following options:"
            +"\n  --suites         (to see full suite info)"
            +"\n  --suitenames     (to see the bare list of suite names)"
            +"\n  --suitenumbers   (to see the list of suite numbers and names)"
            +"\n  For example run with:"
            +"\n    --suite=0"
            +"\n    --suite=functions"
            +"\n  or one of these other tests, shown by number and name:");
    }

    printHelp(){
        console.log( this.colorANSI(Colors.Bold+Colors.Cyan,"Command-line options:\n"
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

     colorANSI(aColor, str){
        if (this.color) {
            return ""+aColor + str + Colors.Reset;
        } else {
            return str;
        }
    }
    

}
