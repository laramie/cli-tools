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

const SRC_FILEPATH_1 =    "./data/src/song.js";
const SRC_FILEPATH_2 =    "./data/src/notetable.js";
const OUTPUT_FILEPATH = "./data/out/generated-song.js";
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




function main(){
    console.log("\n\n💾 ━━━━━━━━━━━━━━━━━━  file: "+SRC_FILEPATH_1+ "  ━━━━━━━━━━━━━━━━━━━━━\n");
    processInvokerFile(SRC_FILEPATH_1);
    
    console.log("\n\n💾 ━━━━━━━━━━━━━━━━━━  file: "+SRC_FILEPATH_2+ "  ━━━━━━━━━━━━━━━━━━━━━\n");
    processInvokerFile(SRC_FILEPATH_2);
    
    console.log("\n\n👍   Tests complete.  ━━━━━━━━━━━━━━━━━━━━━\n");
}

function processInvokerFile(invokerFilename){
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
    writeOutReplacedLines(lineObjectsArray, linesArr)    //  linesArr will be modified!


    console.log("output data struct:\n"+JSON.stringify(lineObjectsArray,null,4));

    //Todo, emit a filtered array based on Line.replacementCount > 0: 
    console.log("\n\n👍   replacements only :\n"+JSON.stringify(lineObjectsArray,null,4));
    
    //Todo, emit a filtered array based on Line.replacementCount === 0: 
    console.log("\n\n🌛    NO OP replacements:\n"+JSON.stringify(lineObjectsArray,null,4));
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



function writeOutReplacedLines(theLineObjectsArray, linesArr){
    theLineObjectsArray.forEach(lineObj => {
        linesArr[lineObj.linenum - 1] = lineObj.replacedLine;
    });
    const newContent = linesArr.join('\n');
    writeFileSync(OUTPUT_FILEPATH, newContent, 'utf8');
}

//==========  Do it! ================
main();

