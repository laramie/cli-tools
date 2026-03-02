#!/usr/bin/env node
/* Node.js utility to search files in a directory
    Run on the bash command line like so, since ths file has a shebang.
        cd ~/infinite-neck/bin/namespacer
        ./find-js-dependencies-replacer.js
    e.g.
        laramie@penguin:~/infinite-neck$ ./bin/find-js-dependencies.js --h
*/

import { readdir, readFileSync, writeFileSync } from 'fs' ;
import { extname, join } from 'path';

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

const PLANS_DIRPATH =   "./data/plans";
const TMP_DIRPATH =     "./data/tmp";
const OUT_DIRPATH =     "./data/out/";

const PLAN_FILEPATH =   "./data/plans/infinite-neck-functions.txt";

// ====== Already kinda handled =======
// song.js            :: [trigger]                [EventBus]            (song.js imports EventBus explicity so can modularly call EventBus.trigger()  == .trigger() should not be scanned because it is already invoke on an object/class/namespace with a dot. 
//
// ====== Good examples for testing ==========
// NoteTableFacade.js :: [clearAll]               (NoteTableFacade]  ( IS_A Namespace)
// NoteTableFacade.js :: [replay]                 [InfiniteNeckFacade]  (replay() is already exported from infinite-neck.js)
// infinite-neck.js   :: [clearAndReplaySection]  [InfiniteNeckFacade]  (infinite-neck.js is not a Namespace, but should become one or be wrapped by a facade which is a Namespace.
// infinite-neck.js   :: [resetNoteNames]         [InfiniteNeckFacade]  (already exported from infinite-neck.js)

const IDENTIFIERS = ["clearAll", "clearAndReplaySection", "replay", "resetNoteNames"];

const NAMESPACE_MAP_DEFAULT = {
    clearAll:               'NoteTableFacade',
    replay:                 'InfiniteNeckFacade',
    clearAndReplaySection:  'InfiniteNeckFacade',
    resetNoteNames:         'InfiniteNeckFacade'
};


/*
   export FIND_DEPENDENCIES_OPTS='  --dir='./data/src/' --suite=functions --quiet --bare --lines  '
   ./find-js-dependencies.js $FIND_DEPENDENCIES_OPTS  infinite-neck.js > ./data/plans/infinite-neck.js.functions.gen
   But this is now all done in bin/namespacer/run-ALL-find-js-dependencies.bash
 */

// Every one of the sources in NamespacerPlan.sources[i].src 
//     will get replacements from the map built by joining all the *.interface.gen files
//     which collectively represent the global namespace.  That map will need to be uniq'd because there can't be conflicts in the global space either.
// After this process we will be in Namespace listed in NamespacerPlan.namespaces[namespaceKey]
//     and all invocations that are now like clearAll() will become IInfiniteNeck.clearAll().
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
            bareList:  "./data/plans/infinite-neck.js.functions.gen",
            interface: "./data/plan/infinite-neck.js.interface.gen",
            source:    "./data/out/IInfiniteNeck.js"
        },
        {
            namespace: "ISong",
            bareList:  "./data/plans/song.js.functions.gen",
            interface: "./data/plan/song.js.interface.gen",
            source:    "./data/out/ISong.js"
        },
        {
            namespace: "INoteTable",
            bareList:  "./data/plans/notetable.js.functions.gen",
            interface: "./data/plan/notetable.js.interface.gen",
            source:    "./data/out/INoteTable.js"
        },
        {
            namespace: "IColorFunctions",
            bareList:  "./data/plans/colorFunctions.js.functions.gen",
            interface: "./data/plan/colorFunctions.js.interface.gen",
            source:    "./data/out/IColorFunctions.js"
        }
    ]
    
}
    
function dump(obj){
    return JSON.stringify(obj,null,4);
}

function readSourceFile(filePath){
    return readFileSync(filePath, 'utf8');
}

//=======================================================================

function main(){
    function log(filename){
         console.log("\n\n💾 ━━━━━━━━━━━━━━━━━━  file: "+filename+ "  ━━━━━━━━━━━━━━━━━━━━━\n");
    }

    let masterNamespaceMap = {}; //was NAMESPACE_MAP_DEFAULT for testing, now will be loaded for real.
    NamespacerPlan.namespaces.forEach(namespaceObj => {
        addIdentifiersToMap(namespaceObj.bareList, namespaceObj.namespace, masterNamespaceMap);
    });

    console.log("🧀------------------------- masterNamespaceMap :: \n"+dump(masterNamespaceMap)+"\n\n--------------------------------🧀");

    // Loop over all sources in NamespacerPlan and process each
    NamespacerPlan.sources.forEach(sourceObj => {
        log(sourceObj.src);
        processFileWithInvocations(sourceObj.src, sourceObj.out, masterNamespaceMap);
    });
    console.log("\n\n👍   Tests complete.  ━━━━━━━━━━━━━━━━━━━━━\n");
}


var DEBUG_LEVEL=0;

function processFileWithInvocations(fileWithInvocations_Name, outputFilePath, masterNamespaceMap){
    let content = readSourceFile(fileWithInvocations_Name);
    const linesArr = content.split('\n');
    let lineObjectsArray = createLineObjectsArray(content, linesArr, IDENTIFIERS); 
    generateReplacedLines(lineObjectsArray, masterNamespaceMap);
    writeOutReplacedLines(lineObjectsArray, linesArr, outputFilePath)    //  linesArr will be modified!


    if (DEBUG_LEVEL>=2) console.log("🥞  Output data struct:\n"+JSON.stringify(lineObjectsArray,null,4));

    const replacementsOnly = lineObjectsArray.filter(lineObj => lineObj.replacementCount > 0);
     if (DEBUG_LEVEL>=1) console.log("\n\n👍   replacements only :\n"+JSON.stringify(replacementsOnly, null, 4));
     if (DEBUG_LEVEL=0){



        /*
        given replacementsOnly is an array of these: 
                {
                    "identifier": "clearAll",
                    "startIndex": 27469,
                    "linenum": 695,
                    "rawLine": "    clearAll();",
                    "replacedLine": "    INoteTable.clearAll();",
                    "namespace": "INoteTable",
                    "regexUsed": {},
                    "replacementCount": 1
                }
        write a function to act as the JSON.stringify replacer to emit the string  
                 `{o.linenum}:{replacedLine}`
           so it turn into a javascript array of strings, and thus, with the indentation of 4, should be an array item per line:

            [
              "695:INoteTable.clearAll();",
              "696:    IInfiniteNeck.resetNoteNames();"
            ]

        */
       console.log(
            JSON.stringify(replacementsOnly, replacer, 4)
        );



    } 


    const noOpReplacements = lineObjectsArray.filter(lineObj => lineObj.replacementCount === 0);
     if (DEBUG_LEVEL>=2) console.log("\n\n🌛    NO OP replacements:\n"+JSON.stringify(noOpReplacements, null, 4));
}

function loadPlan(listingFile){

}

//Set up the Map of all functions in all Interface providers, 
    // checking for conflicts: if the map already contains the identifier as key,
    // Then log a WARN with the identifier, the existing entry's Namespace, and the newcomer's Namespace.
    // Do not add the conflicting key.  
    // TODO: Accumulate this log message in an array to be dumped again at the end of main().
// MODIFIES masterNamespaceMap passed in by adding entries, but not hosing any keys or allowing duplicates.
function addIdentifiersToMap(planFilepath, theNamespaceString, masterNamespaceMap){
    let plan = readSourceFile(planFilepath);
    if (!plan){
        console.error("🛑  No plan file found, or file empty: "+planFilepath);
        process.exit(1);
    }
    let theIdentifiers = plan.split('\n').map(id => id.trim()).filter(id => id.length > 0);
    
    theIdentifiers.forEach(id => {
        if (masterNamespaceMap[id]){
            console.error(`❌ duplicate key found in map[${id}]:${dump(masterNamespaceMap[id])} when trying to add ${dump(theNamespaceString)}`); 
        } else {
            masterNamespaceMap[id] = theNamespaceString;
        }
    });
}


function createLineObjectsArray(content, linesArr, identifiers){
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

