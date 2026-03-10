#!/usr/bin/env node


import { Replacer } from './Replacer.js';
import { FindMain } from './FindMain.js';
import { RegexSuites } from './RegexSuites.js';
import { ANSIColors } from './ANSIColors.js';
import { Accumulator } from './Accumulator.js';
import { readdir, readFileSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
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
        
        
        const findMainStepAccumulator = Accumulator.getStepInstance("FindMain");
        const findMain = new FindMain(findMainStepAccumulator);
        //Search:
        findMain.runWithNamedOptionsFile(configFilename, regexSuites, prePlanActions);
        
        const replacerStepAccumulator = Accumulator.getStepInstance("Replacer");

        const replacer = new Replacer(this.namespacerPlan, replacerStepAccumulator);
        //Generate Interfaces:
        let masterNamespaceMap = replacer.processAllNamespaces_ReturnMasterNamespaceMap();
        
        //Replace:
        replacer.processAllSources(masterNamespaceMap);

        const printOptions = {  printObjects: true, 
                                prettyObjects: true, 
                                objectKeysOnly: false, 
                                objectSquash: false,
                                oneLiner: true 
                            };
        accumulator.appendOutputFiles(printOptions);
        
    }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  // This file is being run directly
  new PlanRunner().main();
}
