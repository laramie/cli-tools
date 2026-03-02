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
    namespaces: {
        "IInfiniteNeck": {
            namespace: "IInfiniteNeck",
            bareList:  "./data/plans/infinite-neck.js.functions.gen",
            interface: "./data/plan/infinite-neck.js.interface.gen",
            source:    "./data/out/IInfiniteNeck.js"
        },
        "INoteTable":  {
            namespace: "INoteTable",
            bareList:  "./data/plans/notetable.js.functions.gen",
            interface: "./data/plan/notetable.js.interface.gen",
            source:    "./data/out/INoteTable.js"
        },
        "IColorFunctions": {
            namespace: "IColorFunctions",
            bareList:  "./data/plans/colorFunctions.js.functions.gen",
            interface: "./data/plan/colorFunctions.js.interface.gen",
            source:    "./data/out/colorFunctions.js"
        }
    }
    
}
    

function main(){
    function log(filename){
         console.log("\n\n💾 ━━━━━━━━━━━━━━━━━━  file: "+filename+ "  ━━━━━━━━━━━━━━━━━━━━━\n");
    }

    // TODO: Following this pattern for two source files: 
    const SRC_FILEPATH_1 =    "./data/src/song.js";
    const SRC_FILEPATH_2 =    "./data/src/notetable.js";
    const OUTPUT_FILEPATH_1 = "./data/out/generated-song.js";
    const OUTPUT_FILEPATH_2 = "./data/out/generated-notetable.js";
    log(SRC_FILEPATH_1);
    processInvokerFile(SRC_FILEPATH_1, OUTPUT_FILEPATH_1);
    log(SRC_FILEPATH_2);
    processInvokerFile(SRC_FILEPATH_2, OUTPUT_FILEPATH_2);
    // TODO (continued):  .... and instead, implement this pseudo-code loop with the following calls:
        NamespacerPlan.sources.forEach {
             log() ;
             processInvokerFile(sources[i].src, sources[i].out) ;
        }
    // END TODO.         
    
    console.log("\n\n👍   Tests complete.  ━━━━━━━━━━━━━━━━━━━━━\n");
}



function processInvokerFile(invokerFilename, outputFilePath){
    let theIdentifiers = IDENTIFIERS;
    let theNamespaceMap = NAMESPACE_MAP_DEFAULT;
    let plan = readSourceFile(PLAN_FILEPATH);
    if (plan){
        // Split by lines, trim each identifier
        theIdentifiers = plan.split('\n').map(id => id.trim()).filter(id => id.length > 0);
        const theNamespaceString = "InfiniteNeckFacade";
        theNamespaceMap = {};
        theIdentifiers.forEach(id => {
            theNamespaceMap[id] = theNamespaceString;
        });
    }

    let content = readSourceFile(invokerFilename);
    const linesArr = content.split('\n');
    let lineObjectsArray = createLineObjectsArray(content, linesArr, IDENTIFIERS); 
    generateReplacedLines(lineObjectsArray, theNamespaceMap);
    writeOutReplacedLines(lineObjectsArray, linesArr, outputFilePath)    //  linesArr will be modified!


    console.log("output data struct:\n"+JSON.stringify(lineObjectsArray,null,4));

    // Emit a filtered array based on Line.replacementCount > 0:
    const replacementsOnly = lineObjectsArray.filter(lineObj => lineObj.replacementCount > 0);
    console.log("\n\n👍   replacements only :\n"+JSON.stringify(replacementsOnly, null, 4));

    // Emit a filtered array based on Line.replacementCount === 0:
    const noOpReplacements = lineObjectsArray.filter(lineObj => lineObj.replacementCount === 0);
    console.log("\n\n🌛    NO OP replacements:\n"+JSON.stringify(noOpReplacements, null, 4));
}

function loadPlan(listingFile){

}

function readSourceFile(filePath){
    return readFileSync(filePath, 'utf8');
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

