#!/usr/bin/env node


/* Node.js utility to search files in a directory

    Run on the bash command line like so, since ths file has a shebang.
        cd ~/infinite-neck/bin/namespacer
        ./find-js-dependencies-replacer.js
    e.g.
        laramie@penguin:~/infinite-neck$ ./bin/find-js-dependencies.js --h

    Development Notes.

    ====== Already kinda handled =======
    song.js            :: [trigger]                [EventBus]            (song.js imports EventBus explicity so can modularly call EventBus.trigger()  == .trigger() should not be scanned because it is already invoke on an object/class/namespace with a dot. 
  
    This is the only one that does a .interface.plan  the idea was to have the .interface.plan be a human-edited version 
       of .functions.gen, so do the others this way too, or default to the barelist if not present.
            bareList:  "./data/plans/colorFunctions.js.functions.gen",
            interface: "./data/plans/IColorFunctions.js.interface.plan",


    How to run the program to generate input files to this program:
        export FIND_DEPENDENCIES_OPTS='  --dir='./data/src/' --suite=functions --quiet --bare --lines  '
        ./find-js-dependencies.js $FIND_DEPENDENCIES_OPTS  infinite-neck.js > ./data/plans/infinite-neck.js.functions.gen
        But this is now all done in bin/namespacer/run-ALL-find-js-dependencies.bash
*/

import { readdir, readFileSync, writeFileSync } from 'fs' ;
import { extname, join } from 'path';
import {Generator} from './generate-interface.js';

class Line {
    constructor({ identifier, startIndex, linenum, rawLine, replacedLine = '', namespace = '', regexUsed = null }) {
        this.identifier = identifier;      // The bare identifier matched
        this.startIndex = startIndex;      // Start index of the identifier in the file
        this.linenum = linenum;            // Line number (1-based)
        this.rawLine = rawLine;            // The full line of source code
        this.replacedLine = replacedLine;  // The line after replacement (optional)
        this.namespace = namespace;        // Namespace to prepend (optional)
        this.regexUsed = regexUsed;        // Regex used for matching (optional)
        this.replacementCount = 0;
    }
}

const LOG_INTERFACE_GENS = false;
const LOG_MASTER_NAMESPACE_MAP = false;
const LOG_OUTPUT = false;
const LOG_OUTPUT_REPLACEMENTS = false;
const LOG_OUTPUT_NOOP_REPLACEMENTS = false;
const LOG_OUTPUT_REPLACEMENTS_LINENUM = true;

const IDENTIFIERS = ["clearAll", "clearAndReplaySection", "replay", "resetNoteNames"];

const NAMESPACE_MAP_DEFAULT = {
    clearAll:               'NoteTableFacade',
    replay:                 'InfiniteNeckFacade',
    clearAndReplaySection:  'InfiniteNeckFacade',
    resetNoteNames:         'InfiniteNeckFacade'
};


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
    
}


function main(){
    let masterNamespaceMap = {}; //was NAMESPACE_MAP_DEFAULT for testing, now will be loaded for real.
    NamespacerPlan.namespaces.forEach(namespaceObj => {
        addIdentifiersToMap(namespaceObj.bareList, namespaceObj.excludes, namespaceObj.namespace, masterNamespaceMap);
        let gen = new Generator();
        let interface_gen = gen.generateInterfaceFromNamespaceObj(namespaceObj, LOG_INTERFACE_GENS);
        if (LOG_INTERFACE_GENS) console.log("🎲  ---\n"+interface_gen+"\n---  🎲");
        console.log("\n💾  Writing generated Interface --->"+namespaceObj.sourceout+"<---\n");
        writeFileSync(namespaceObj.sourceout, interface_gen, 'utf8');
    });

    if (LOG_MASTER_NAMESPACE_MAP) console.log("🧀------------------------- masterNamespaceMap :: \n"+dump(masterNamespaceMap)+"\n\n--------------------------------🧀");

    // Loop over all sources in NamespacerPlan and process each
    NamespacerPlan.sources.forEach(sourceObj => {
        logFilename(sourceObj.src);
        processFileWithInvocations(sourceObj.src, sourceObj.out, masterNamespaceMap);
    });
    console.log("\n\n👍   Tests complete.  ━━━━━━━━━━━━━━━━━━━━━\n");
}

function logFilename(filename){
        console.log("\n\n💾 ━━━━━━━━━━━━━━━━━━  file: "+filename+ "  ━━━━━━━━━━━━━━━━━━━━━\n");
}
function dump(obj){
    return JSON.stringify(obj,null,4);
}

function readSourceFile(filePath){
    return readFileSync(filePath, 'utf8');
}

function processFileWithInvocations(fileWithInvocations_Name, outputFilePath, masterNamespaceMap){
    let content = readSourceFile(fileWithInvocations_Name);
    const linesArr = content.split('\n');
    
    // Use all keys from masterNamespaceMap as identifiers
    let identifiersInMasterNamespaceMapKeys = Object.keys(masterNamespaceMap);
    let lineObjectsArray = createLineObjectsArray(content, linesArr, identifiersInMasterNamespaceMapKeys); 
    generateReplacedLines(lineObjectsArray, masterNamespaceMap);
    writeOutReplacedLines(lineObjectsArray, linesArr, outputFilePath)    //  linesArr will be modified!


    if (LOG_OUTPUT) console.log("🥞  Output data struct:\n"+JSON.stringify(lineObjectsArray,null,4));

    const replacementsOnly = lineObjectsArray.filter(lineObj => lineObj.replacementCount > 0);
    if (LOG_OUTPUT_REPLACEMENTS) console.log("\n\n👍   replacements only :\n"+JSON.stringify(replacementsOnly, null, 4));
    if (LOG_OUTPUT_REPLACEMENTS_LINENUM) {
        console.log( JSON.stringify(   replacementsOnly, 
                                       ((key, value)=> {
                                          if (Array.isArray(value)) {
                                            return value.map(o => `${o.linenum}:${o.replacedLine}`);
                                          }
                                          return value;
                                        }), 
                                       4
                                    )
        );
    } 


    const noOpReplacements = lineObjectsArray.filter(lineObj => lineObj.replacementCount === 0);
     if (LOG_OUTPUT_NOOP_REPLACEMENTS) console.log("\n\n🌛    NO OP replacements:\n"+JSON.stringify(noOpReplacements, null, 4));
}

function loadPlan(listingFile){

}

function addIdentifiersToMap(planFilepath, excludesFilepath, theNamespaceString, masterNamespaceMap){
    let theExcludes = [];
    if (excludesFilepath){
        let excludesLines = readSourceFile(excludesFilepath);
        if (excludesLines){
            theExcludes = excludesLines
                .split('\n')
                .map(id => id.trim())
                .filter(id => id.length > 0);
        }
    }

    let plan = readSourceFile(planFilepath);
    if (!plan){
        console.error("🛑  No plan file found, or file empty: "+planFilepath);
        process.exit(1);
    }

    let theIdentifiers = plan
        .split('\n')
        .map(id => id.trim())
        .filter(id => id.length > 0 && !theExcludes.includes(id));

    theIdentifiers.forEach(id => {
        if (masterNamespaceMap[id]){
            console.error(`❌ duplicate key found in map["${id}"]:${dump(masterNamespaceMap[id])} when trying to add ${dump(theNamespaceString)}.${id}`); 
        } else {
            masterNamespaceMap[id] = theNamespaceString;
        }
    });
}


function createLineObjectsArray(content, linesArr, identifiers){
    //console.log("\n\n\n******************* linesArray:"+JSON.stringify(linesArr)+"***************\n\n");
    //console.log("\n\n\n******************* identifiers:"+JSON.stringify(identifiers)+"***************\n\n");
    const identifierPattern = identifiers.join('|');
    const lineRegex = new RegExp(`^.*\\b(${identifierPattern})\\b\\s*\\(.*$`, 'gm');

    let match;
    const lineObjects = [];
    while ((match = lineRegex.exec(content)) !== null) {
        // Find line number by counting newlines up to match.index
        const upToMatch = content.slice(0, match.index);
        const linenum = upToMatch.split('\n').length;
        const rawLine = linesArr[linenum - 1];
        const identifier = match[1];
        const startIndex = match.index + match[0].indexOf(identifier);

        lineObjects.push(new Line({
            identifier,
            startIndex,
            linenum,
            rawLine,
            regexUsed: lineRegex
        }));
    }
    return lineObjects;
}


function generateReplacedLines(theLineObjectsArray, namespaceMap){
    theLineObjectsArray.forEach(lineObj => {
        if (namespaceMap[lineObj.identifier]) {
            // Replace only the first occurrence in the line
            const pattern = new RegExp(`\\b${lineObj.identifier}\\b`);
            lineObj.replacedLine = lineObj.rawLine.replace(
                pattern,
                `${namespaceMap[lineObj.identifier]}.${lineObj.identifier}`
            );
            lineObj.namespace = namespaceMap[lineObj.identifier];
            lineObj.replacementCount++;
        } else {
            lineObj.replacedLine = lineObj.rawLine;
            lineObj.replacementCount = 0;
        }
    });
}



function writeOutReplacedLines(theLineObjectsArray, linesArr, outputFilePath){
    theLineObjectsArray.forEach(lineObj => {
        linesArr[lineObj.linenum - 1] = lineObj.replacedLine;
    });
    const newContent = linesArr.join('\n');
    writeFileSync(outputFilePath, newContent, 'utf8');
}

//==========  Do it! ================
main();

