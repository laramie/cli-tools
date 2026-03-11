#!/usr/bin/env node

import { Replacer } from './Replacer.js';
import { FindMain } from './FindMain.js';
import { RegexSuites } from './RegexSuites.js';
import { ANSIColors } from './ANSIColors.js';
import { Accumulator } from './Accumulator.js';
import { fileURLToPath } from 'url';

const NamespacerPlan = {
    sources:[
        {
            src:  "./data/src/song.js",
            out:  "./data/out/generated-song.js"
        },
        {
            src:  "./data/src/notetable.js",
            out:  "./data/out/generated-notetable.js"
        }
    ],
    namespaces: [
        {
            namespace: "IInfiniteNeck",
            legacyImpl: "infiniteNeckImpl",
            bareList:  "./data/plans/infinite-neck.js.functions.gen",
            excludes:  "",
            interface: "./data/plans/infinite-neck.js.functions.gen",
            sourceout:    "./data/out/IInfiniteNeck.js"
        },
        {
            namespace: "ISong",
            legacyImpl: "songImpl",
            bareList:  "./data/plans/song.js.functions.gen",
            excludes:  "./data/plans/ISong.js.excludes.plan",
            interface: "./data/plans/song.js.functions.gen",
            sourceout:    "./data/out/ISong.js"
        },
        {
            namespace: "INoteTable",
            legacyImpl: "notetableImpl",
            bareList:  "./data/plans/notetable.js.functions.gen",
            excludes:  "",
            interface: "./data/plans/notetable.js.functions.gen",
            sourceout:    "./data/out/INoteTable.js"
        },
        {
            namespace: "IColorFunctions",
            legacyImpl: "colorFunctionsImpl",
            bareList:  "./data/plans/colorFunctions.js.functions.gen",
            excludes:  "",
            interface: "./data/plans/IColorFunctions.js.interface.plan",
            sourceout:    "./data/out/IColorFunctions.js"
        }
    ]
};
const findMainOptions = {
        "quiet": false,
        "color": true,
        "bareExpressions": false,
        "outputFilename": false,
        "outputLines": true,
        "outputSummary": true,
        "shortSummary": true,
        "outputSourceLocation": false,
        "outputSortedLines": true,
        "verbose": true,
        "debug": false,
        "configSource": "command-line",
        "suiteIdx": 1,
        "extensions": [
            ".js"
        ],
        "dir": "data/src",
        "singleFile": null
      }

const replacerLOG_FLAGS = {
    PLAN_INFO: true,
    FILE_WRITES: true,
    INTERFACE_GENS: true,
    MASTER_NAMESPACE_MAP: true,
    OUTPUT: false,  //these guys are huge and repetative representations of every Replacer::Line object
    OUTPUT_REPLACEMENTS_LINEOBJECTS: false,  // these are the replacements, in Replacer::Line objects [use for debugging OUTPUT_REPLACEMENTS]
    OUTPUT_REPLACEMENTS: true, //These are the actual lines of code *WITHOUT* all the Replacer::Line object info
    OUTPUT_NOOP_REPLACEMENTS: true,
    OUTPUT_REPLACEMENTS_LINENUM: false //Whether, when spitting out OUTPUT_REPLACEMENTS, to use linenumbers. 
};
const printOptions = {  printObjects: true, 
                        prettyObjects: true, 
                        objectKeysOnly: false, 
                        objectSquash: false,
                        oneLiner: true,
                        level: 'info',
                        showOneLinerObjects: true
                    };



export class PlanRunner {
    constructor() {
        this.namespacerPlan = NamespacerPlan;
    }

    main() {
        const accumulator = Accumulator.getInstance();
        accumulator.hoseAccumulatorOutputFiles();
        const configFilename = "runconfig-example.json";
        const prePlanActions = ["🗒  Running from PlanRunner with ☛  "+ANSIColors.green(configFilename)+" ☚"];
        const regexSuites = new RegexSuites();
        
        
        // =========== FindMain =================================
            const findMainStepAccumulator = Accumulator.getStepInstance("FindMain");
            const findMain = new FindMain(findMainStepAccumulator);
            //Search:
            //use a config file from disk with this flavor: findMain.runWithNamedOptionsFile(configFilename, regexSuites, prePlanActions);
            //use a config file in code (above) with this flavor:
            findMain.runWithOptions(findMainOptions, regexSuites, prePlanActions);
        
        // =========== Replacer/Generator =========================
            const replacerStepAccumulator = Accumulator.getStepInstance("Replacer");
            const replacer = new Replacer(this.namespacerPlan, replacerStepAccumulator);
            replacer.setLogFlags(replacerLOG_FLAGS);

            //Generate Interfaces:
            let masterNamespaceMap = replacer.processAllNamespaces_ReturnMasterNamespaceMap();

            //Replace:
            replacer.processAllSources(masterNamespaceMap);

        // ============ Make Pretty Output ========================
            accumulator.appendOutputFiles(printOptions);
        
    }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  // This file is being run directly
  new PlanRunner().main();
}
