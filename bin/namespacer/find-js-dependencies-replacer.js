#!/usr/bin/env node
/* Node.js utility to search files in a directory
    Run on the bash command line like so, since ths file has a shebang.
        cd ~/infinite-neck/bin/namespacer
        ./find-js-dependencies-replacer.js
    e.g.
        laramie@penguin:~/infinite-neck$ ./bin/find-js-dependencies.js --h
*/

class Line {
    constructor({ identifier, startIndex, linenum, rawLine, replacedLine = '', namespace = '', regexUsed = null }) {
        this.identifier = identifier;      // The bare identifier matched
        this.startIndex = startIndex;      // Start index of the identifier in the file
        this.linenum = linenum;            // Line number (1-based)
        this.rawLine = rawLine;            // The full line of source code
        this.replacedLine = replacedLine;  // The line after replacement (optional)
        this.namespace = namespace;        // Namespace to prepend (optional)
        this.regexUsed = regexUsed;        // Regex used for matching (optional)
    }
}

const PLANS_DIRPATH =  "./data/plans";
const TMP_DIRPATH =    "./data/tmp";
const OUT_DIRPATH =    "./data/out/";

const SRC_FILEPATH =   "./data/src/song.js";
const OUTPUT_FILEPATH =   "./data/out/generated-song.js";

// ====== Already kinda handled =======
// song.js            :: [trigger]                [EventBus]            (song.js imports EventBus explicity so can modularly call EventBus.trigger()  == .trigger() should not be scanned because it is already invoke on an object/class/namespace with a dot. 
//
// ====== Good examples for testing ==========
// NoteTableFacade.js :: [clearAll]               (NoteTableFacade]  ( IS_A Namespace)
// NoteTableFacade.js :: [replay]                 [InfiniteNeckFacade]  (replay() is already exported from infinite-neck.js)
// infinite-neck.js   :: [clearAndReplaySection]  [InfiniteNeckFacade]  (infinite-neck.js is not a Namespace, but should become one or be wrapped by a facade which is a Namespace.
// infinite-neck.js   :: [resetNoteNames]         [InfiniteNeckFacade]  (already exported from infinite-neck.js)

const IDENTIFIERS = ["clearAll", "clearAndReplaySection", "replay", "resetNoteNames"];

const namespaceMap = {
    clearAll:               'NoteTableFacade',
    replay:                 'InfiniteNeckFacade',
    clearAndReplaySection:  'InfiniteNeckFacade',
    resetNoteNames:         'InfiniteNeckFacade'
};


function main(){
    let content = readSourceFile(SRC_FILEPATH);
    let inMemStruct = createLinesDataStructure(content, IDENTIFIERS);
    console.log("output data struct:\n"+JSON.stringify(inMemStruct,null,4));
}

function readSourceFile(filePath){
    return fs.readFileSync(filePath, 'utf8');
}


function createLinesDataStructure(content, identifiers){
    const linesArr = content.split('\n');

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


function generateReplacedLines(lineObjects){
    lineObjects.forEach(lineObj => {
        if (namespaceMap[lineObj.identifier]) {
            // Replace only the first occurrence in the line
            const pattern = new RegExp(`\\b${lineObj.identifier}\\b`);
            lineObj.replacedLine = lineObj.rawLine.replace(
                pattern,
                `${namespaceMap[lineObj.identifier]}.${lineObj.identifier}`
            );
            lineObj.namespace = namespaceMap[lineObj.identifier];
        } else {
            lineObj.replacedLine = lineObj.rawLine;
        }
    });
}



function writeOutReplacedLines(){
    lineObjects.forEach(lineObj => {
        linesArr[lineObj.linenum - 1] = lineObj.replacedLine;
    });
    const newContent = linesArr.join('\n');
    fs.writeFileSync(OUTPUT_FILEPATH, newContent, 'utf8');
}

//==========  Do it! ================
main();

