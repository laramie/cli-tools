#!/usr/bin/env node


/* Node.js utility to search files in a directory

    Run on the bash command line like so, since ths file has a shebang.
        cd ~/infinite-neck/bin/namespacer
        ./Replacer.js
    e.g.
        laramie@penguin:~/infinite-neck$ ./bin/namespacer/Replacer.js

    Development Notes.

    ====== Already kinda handled =======
    song.js            :: [trigger]                [EventBus]            (song.js imports EventBus explicity so can modularly call EventBus.trigger()  == .trigger() should not be scanned because it is already invoke on an object/class/namespace with a dot. 
  
    This is the only one that does a .interface.plan  the idea was to have the .interface.plan be a human-edited version 
       of .functions.gen, so do the others this way too, or default to the barelist if not present.
            bareList:  "./data/plans/colorFunctions.js.functions.gen",
            interface: "./data/plans/IColorFunctions.js.interface.plan",


    How to run the program to generate input files to this program:
        export FIND_DEPENDENCIES_OPTS='  --dir='./data/src/' --suite=functions --quiet --bare --lines  '
        ./FindMain.js $FIND_DEPENDENCIES_OPTS  infinite-neck.js > ./data/plans/infinite-neck.js.functions.gen
        But this is now all done in bin/namespacer/run-ALL-FindMain.bash
*/

import { readdir, readFileSync, writeFileSync } from 'fs' ;
import { extname, join } from 'path';
import {GenerateInterface} from './GenerateInterface.js';

// Enum-like object for readSourceFile status codes
export const ReadSourceStatus = Object.freeze({
    NO_PATH: 'no-path',
    FOUND: 'found',
    NOT_FOUND: 'not-found',
    READ_ERROR: 'read-error'
});


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

export class Replacer {
    
    static ReadSourceStatus = ReadSourceStatus;
    
    constructor(namespacerPlan) {
        this.namespacerPlan = namespacerPlan;
    }
    logError(message){
        console.error(message);
    }
    log(flag, message, flagObj = Replacer.LOG_FLAGS) {
        if (typeof flag === 'string') {
            if (flagObj[flag]) {
                console.log(message);
            }
        } else if (flag) {
            console.log(message);
        }
    }
    /**
     * Escape special regex characters in a string for safe use in RegExp.
     * @param {string} str
     * @returns {string}
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static VERBOSE_INTERFACE_GENS = true;  // used to have GenerateInterface also print out output

    static LOG_FLAGS = {
        FILE_WRITES: true,
        INTERFACE_GENS: false,
        MASTER_NAMESPACE_MAP: false,
        OUTPUT: false,
        OUTPUT_REPLACEMENTS: false,
        OUTPUT_NOOP_REPLACEMENTS: false,
        OUTPUT_REPLACEMENTS_LINENUM: true
    };


    
    /**
     * Log the filename being processed.
     * @param {string} filename
     */
    logFilename(filename){
        this.log(true, "\n\n💾 ━━━━━━━━━━━━━━━━━━  file: "+filename+ "  ━━━━━━━━━━━━━━━━━━━━━\n");
    }


    dump(obj){
        return JSON.stringify(obj,null,4);
    }

    /**
     * Read a file and return its contents as a string. Returns empty string if file is missing or empty.
     * @param {string} filePath
     * @returns {string}
     */
    readSourceFile(filePath) {
        const Status = Replacer.ReadSourceStatus;
        try {
            if (!filePath) {
                return { status: Status.NO_PATH, error: null, contents: "" };
            }
            const data = readFileSync(filePath, 'utf8');
            return { status: Status.FOUND, error: null, contents: data || "" };
        } catch (err) {
            if (err.code === 'ENOENT') {
                this.logError(`File not found: ${filePath}`);
                return { status: Status.NOT_FOUND, error: err, contents: "" };
            } else {
                this.logError(`Error reading file: ${filePath} (${err.message})`);
                return { status: Status.READ_ERROR, error: err, contents: "" };
            }
        }
    }

    processFileWithInvocations(fileWithInvocations_Name, outputFilePath, masterNamespaceMap){
        let content = this.readSourceFile(fileWithInvocations_Name);
        const linesArr = content.split('\n');
        
        // Use all keys from masterNamespaceMap as identifiers
        let identifiersInMasterNamespaceMapKeys = Object.keys(masterNamespaceMap);
        let lineObjectsArray = this.createLineObjectsArray(content, linesArr, identifiersInMasterNamespaceMapKeys); 
        this.generateReplacedLines(lineObjectsArray, masterNamespaceMap);
        this.writeOutReplacedLines(lineObjectsArray, linesArr, outputFilePath)    //  linesArr will be modified!


        this.log('OUTPUT', "🥞  Output data struct:\n"+JSON.stringify(lineObjectsArray,null,4));

        const replacementsOnly = lineObjectsArray.filter(lineObj => lineObj.replacementCount > 0);
        this.log('OUTPUT_REPLACEMENTS', "\n\n👍   replacements only :\n"+JSON.stringify(replacementsOnly, null, 4));
        if (Replacer.LOG_FLAGS.OUTPUT_REPLACEMENTS_LINENUM) {
            this.log(true, JSON.stringify(
                replacementsOnly,
                ((key, value)=> {
                    if (Array.isArray(value)) {
                        return value.map(o => `${o.linenum}:${o.replacedLine}`);
                    }
                    return value;
                }),
                4
            ));
        }


        const noOpReplacements = lineObjectsArray.filter(lineObj => lineObj.replacementCount === 0);
        this.log('OUTPUT_NOOP_REPLACEMENTS', "\n\n🌛    NO OP replacements:\n"+JSON.stringify(noOpReplacements, null, 4));
    }

    loadPlan(listingFile){

    }

    addIdentifiersToMap(planFilepath, excludesFilepath, theNamespaceString, masterNamespaceMap) {
        let theExcludes = [];
        if (excludesFilepath) {
            let excludesLines = this.readSourceFile(excludesFilepath);
            if (excludesLines) {
                theExcludes = excludesLines
                    .split('\n')
                    .map(id => id.trim())
                    .filter(id => id.length > 0);
            }
        }

        let plan = this.readSourceFile(planFilepath);
        if (!plan) {
            this.logError("🛑  No plan file found, or file empty: " + planFilepath);
            return { added: 0 };
        }

        let theIdentifiers = plan
            .split('\n')
            .map(id => id.trim())
            .filter(id => id.length > 0 && !theExcludes.includes(id));

        let added = 0;
        theIdentifiers.forEach(id => {
            if (masterNamespaceMap[id]) {
                this.logError(`❌ duplicate key found in map["${id}"]:${this.dump(masterNamespaceMap[id])} when trying to add ${this.dump(theNamespaceString)}.${id}`);
            } else {
                masterNamespaceMap[id] = theNamespaceString;
                added++;
            }
        });
        return { added };
    }

    /**
     * Create an array of Line objects for each matched identifier in the content.
     * Escapes regex special characters in identifiers.
     * @param {string} content
     * @param {string[]} linesArr
     * @param {string[]} identifiers
     * @returns {Line[]}
     */
    createLineObjectsArray(content, linesArr, identifiers){
        if (!identifiers || identifiers.length === 0) return [];
        const identifierPattern = identifiers.map(escapeRegex).join('|');
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

    generateReplacedLines(theLineObjectsArray, namespaceMap){
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



    writeOutReplacedLines(theLineObjectsArray, linesArr, outputFilePath){
        theLineObjectsArray.forEach(lineObj => {
            linesArr[lineObj.linenum - 1] = lineObj.replacedLine;
        });
        const newContent = linesArr.join('\n');
        writeFileSync(outputFilePath, newContent, 'utf8');
    }

    /**
     * Main entry point for the dependency replacer script.
     * Loads namespace plans, generates interfaces, and processes source files.
     * Mutates masterNamespaceMap in place.
     */
    main(){
        let masterNamespaceMap = {};
        this.namespacerPlan.namespaces.forEach(namespaceObj => {
            const { added } = this.addIdentifiersToMap(namespaceObj.bareList, namespaceObj.excludes, namespaceObj.namespace, masterNamespaceMap);
            if (added === 0) {
                this.logError(`🚫   Skipping ${namespaceObj.namespace}: no identifiers added.`);
                return;
            }
            let gen = new GenerateInterface();
            let interface_gen = gen.generateInterfaceFromNamespaceObj(namespaceObj, Replacer.VERBOSE_INTERFACE_GENS);
            this.log('INTERFACE_GENS', "🎲  ---\n"+interface_gen+"\n---  🎲");
            this.log('FILE_WRITES', "\n💾  Writing generated Interface --->"+namespaceObj.sourceout+"<---\n");
            writeFileSync(namespaceObj.sourceout, interface_gen, 'utf8');
        });

        this.log('MASTER_NAMESPACE_MAP', "🧀------------------------- masterNamespaceMap :: \n"+this.dump(masterNamespaceMap)+"\n\n--------------------------------🧀");

        // Loop over all sources in NamespacerPlan and process each
        this.namespacerPlan.sources.forEach(sourceObj => {
            this.logFilename(sourceObj.src);
            this.processFileWithInvocations(sourceObj.src, sourceObj.out, masterNamespaceMap);
        });
        this.log(true, "\n\n👍   Tests complete.  ━━━━━━━━━━━━━━━━━━━━━\n");
    }

}



