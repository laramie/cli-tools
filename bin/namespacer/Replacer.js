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
import {SourceFile}  from './SourceFile.js';
import {Accumulator} from './Accumulator.js';

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
    
    constructor(namespacerPlan, accumulator) {
        this.namespacerPlan = namespacerPlan;
        this.accumulator = accumulator;    //will actually be passed a Decorated StepAccumulator.
        this.logFlags = Replacer.LOG_FLAGS;
    }

    setLogFlags(flags) {
        this.logFlags = flags;
    }
    logError(message){
        console.error(message);
    }
    log(flag, message) {
        if (flag) {
            console.log(message);
        }
    }
    logStep(flag, icon, message, obj){
        if (flag){
            let theStep = this.accumulator.newStep({
                icon: icon,
                logline: message,
                obj: obj
            });
            this.accumulator.logStep(theStep);
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
        PLAN_INFO: false,
        FILE_WRITES: false,
        INTERFACE_GENS: false,
        MASTER_NAMESPACE_MAP: false,
        OUTPUT: false,
        OUTPUT_REPLACEMENTS: false,
        OUTPUT_NOOP_REPLACEMENTS: false,
        OUTPUT_REPLACEMENTS_LINENUM: false
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

    
    processFileWithInvocations(fileWithInvocations_Name, outputFilePath, masterNamespaceMap){
        this.accumulator.logFile("processFileWithInvocations::file:"+fileWithInvocations_Name, outputFilePath);
        const { status, error, contents } = SourceFile.read(fileWithInvocations_Name);
        if (status !== Replacer.ReadSourceStatus.FOUND) {
            this.logError(`Failed to read file: ${fileWithInvocations_Name} (status: ${status})`);
            return;
        }
        
        const linesArr = contents.split('\n');
        
        // Use all keys from masterNamespaceMap as identifiers
        let identifiersInMasterNamespaceMapKeys = Object.keys(masterNamespaceMap);
        let lineObjectsArray = this.createLineObjectsArray(contents, linesArr, identifiersInMasterNamespaceMapKeys); 
        this.generateReplacedLines(lineObjectsArray, masterNamespaceMap);
        this.writeOutReplacedLines(lineObjectsArray, linesArr, outputFilePath)    //  linesArr will be modified!


        this.log(this.logFlags.OUTPUT, "🥞  Output data struct:\n"+JSON.stringify(lineObjectsArray,null,4));
        this.logStep(this.logFlags.OUTPUT, '🥞', "Output data struct", lineObjectsArray);
        

        const replacementsOnly = lineObjectsArray.filter(lineObj => lineObj.replacementCount > 0);
        this.log(this.logFlags.OUTPUT_REPLACEMENTS, "\n\n👍   replacements only :\n"+JSON.stringify(replacementsOnly, null, 4));
        this.logStep(this.logFlags.OUTPUT_REPLACEMENTS, '👍', "replacements only", replacementsOnly);
        
        if (this.logFlags.OUTPUT_REPLACEMENTS_LINENUM) {
            const replacementsLinenumReplacer = (key, value) =>
                Array.isArray(value) ? value.map(o => `${o.linenum}:${o.replacedLine}`) : value;

            //TODO: move arrow function in here.
            const stringified = JSON.stringify(
                replacementsOnly,
                replacementsLinenumReplacer,
                4
            );
            this.log(true, "replacements:"+stringified);
            const obj = JSON.parse(stringified);

            this.logStep(this.logFlags.OUTPUT_REPLACEMENTS_LINENUM, Emoji.BULLET, "replacements", obj);
            
        }


        const noOpReplacements = lineObjectsArray.filter(lineObj => lineObj.replacementCount === 0);
        this.log(this.logFlags.OUTPUT_NOOP_REPLACEMENTS, "\n\n🌛    NO OP replacements:\n"+JSON.stringify(noOpReplacements, null, 4));
        this.logStep(this.logFlags.OUTPUT_NOOP_REPLACEMENTS, '🌛', "NO OP replacements", noOpReplacements);
    }

    loadPlan(listingFile){

    }

    addIdentifiersToMap(planFilepath, excludesFilepath, theNamespaceString, masterNamespaceMap) {
        let theExcludes = [];
        if (excludesFilepath) {
            const { status: exclStatus, contents: excludesLines } = SourceFile.read(excludesFilepath);
            if (exclStatus === Replacer.ReadSourceStatus.FOUND && excludesLines) {
                theExcludes = excludesLines
                    .split('\n')
                    .map(id => id.trim())
                    .filter(id => id.length > 0);
            }
        }

        const { status: planStatus, contents: plan, error: planError } = SourceFile.read(planFilepath);
        switch (planStatus) {
            case Replacer.ReadSourceStatus.NOT_FOUND:
                const errmsg0 = `Plan file not found: ${planFilepath}`;
                this.logError("🚫  "+errmsg0);
                this.accumulator.logLine(errmsg1, '🚫');
                return { added: 0 };
            case Replacer.ReadSourceStatus.READ_ERROR:
                const errmsg1 = `Error reading plan file: ${planFilepath}\n  Error: ${planError && (planError.stack || planError.message || planError.toString())}`;
                this.logError("🛑  "+errmsg1);
                this.accumulator.logLine(errmsg1, '🛑');
                return { added: 0 };
            case Replacer.ReadSourceStatus.FOUND:
                if (!plan) {
                    this.log(this.logFlags.PLAN_INFO, `🪲  Plan file found and is empty: ${planFilepath}`);
                    if (this.logFlags.PLAN_INFO) this.accumulator.logStep({icon:'🪲 ', logline:"Plan file found and is empty:"+planFilepath,obj:{}});
  
                    return { added: 0 };
                }
                break;
            default:
                const errmsg2 =`Unknown error reading plan file: ${planFilepath}\n  Error: ${planError && (planError.stack || planError.message || planError.toString())}`;
                this.logError(`🛑   `+errmsg);
                this.accumulator.logLine(errmsg, '🛑');
                return { added: 0 };
        }

        let theIdentifiers = plan
            .split('\n')
            .map(id => id.trim())
            .filter(id => id.length > 0 && !theExcludes.includes(id));

        let added = 0;
        theIdentifiers.forEach(id => {
            if (masterNamespaceMap[id]) {
                let errmsg = `duplicate key found in map["${id}"]:${this.dump(masterNamespaceMap[id])} when trying to add ${this.dump(theNamespaceString)}.${id}`;
                this.logError("❌ "+errmsg);
                this.accumulator.logLine(errmsg, '❌');
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
        //const identifierPattern = identifiers.map(escapeRegex).join('|');
        const identifierPattern = identifiers.map(str => this.escapeRegex(str)).join('|');

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
     * Loads and processes NamespacerPlan.sources[] files.
     * Generates interfaces.
     * Creates masterNamespaceMap, and returns it.
     */
    processAllNamespaces_ReturnMasterNamespaceMap(){
        // Deep clone namespacerPlan so we can mutate the clone in the loop
        const clonePlan = JSON.parse(JSON.stringify(this.namespacerPlan));
        let masterNamespaceMap = {};
        clonePlan.namespaces.forEach(namespaceObj => {
            const { added } = this.addIdentifiersToMap(namespaceObj.bareList, namespaceObj.excludes, namespaceObj.namespace, masterNamespaceMap);
            if (added === 0) {
                this.logError(`🚫   Skipping ${namespaceObj.namespace}: no identifiers added.`);
                this.accumulator.logLine(`Skipping ${namespaceObj.namespace}: no identifiers added.`, '🚫');
                return;
            }
            let gen = new GenerateInterface();
            let interface_gen = gen.generateInterfaceFromNamespaceObj(namespaceObj, Replacer.VERBOSE_INTERFACE_GENS);
            this.log    (this.logFlags.INTERFACE_GENS, "🎲  ---\n"+interface_gen+"\n---  🎲");
            this.logStep(this.logFlags.INTERFACE_GENS, '🎲',"interface_gen",interface_gen);
  
            this.log(this.logFlags.FILE_WRITES, "\n💾  Writing generated Interface --->"+namespaceObj.sourceout+"<---\n");
            if (this.logFlags.FILE_WRITES) this.accumulator.logFile("Writing generated Interface", namespaceObj.sourceout);
            writeFileSync(namespaceObj.sourceout, interface_gen, 'utf8');
            // Attach generated strings to the namespaceObj in the clone
            namespaceObj.interface_gen = interface_gen;
            //namespaceObj.masterNamespaceMap = JSON.stringify(masterNamespaceMap, null, 2);
            namespaceObj.masterNamespaceMap = masterNamespaceMap;
        });
        // Dump the mutated clone to see per-loop changes
        console.log("\n🩺 namespacerPlan clone with per-namespace changes:\n" + JSON.stringify(clonePlan, null, 2));
        this.accumulator.logObject("Replacer::processAllNamespaces_ReturnMasterNamespaceMap doing dump", clonePlan );
        this.log(this.logFlags.MASTER_NAMESPACE_MAP, "🧀------------------------- masterNamespaceMap :: \n"+this.dump(masterNamespaceMap)+"\n\n--------------------------------🧀");
        return masterNamespaceMap;
    }

     /**
     * Loads and processes NamespacerPlan.sources[] files, from namespacerPlan set in constructor.
     * Requires masterNamespaceMap returned from processAllNamespaces_ReturnMap().
     */
    processAllSources(masterNamespaceMap){
        // Loop over all sources in NamespacerPlan and process each
        this.namespacerPlan.sources.forEach(sourceObj => {
            this.logFilename(sourceObj.src);
            this.processFileWithInvocations(sourceObj.src, sourceObj.out, masterNamespaceMap);
        });
        this.log(true, "\n\n👍   Tests complete.  ━━━━━━━━━━━━━━━━━━━━━\n");
        this.logStep(true, '👍', "Replacer processAllSources DONE", {});
    }

}



