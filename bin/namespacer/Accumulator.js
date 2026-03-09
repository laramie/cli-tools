
// Accumulator.js - ES6 Singleton Accumulator for plan logging
import { ANSIColors } from './ANSIColors.js';
import { Emoji } from './Emoji.js';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { Logger } from './Logger.js';
import StepAccumulator from './StepAccumulator.js';

let _GID = 1;
const ACCUMULATOR_LOGLINES = "_accumulator.loglines.txt";
const ACCUMULATOR_STEPS    = "_accumulator.steps.json";




export class Accumulator {
    constructor() {
        if (Accumulator._instance) {
            return Accumulator._instance;
        }
        this._ID = _GID++;
        this._loglinesArray = [];
        this._stepsArray = [];
        this.logger = Logger.getInstance();
        Accumulator._instance = this;
    }

    accumulate(logline) {
        //console.log("++++++++++++++++++Accumulator.accumulate:::"+logline+":::");
        if (arguments.length > 1) {
            const bigObject = arguments[1];
            const entry = { logline, bigObject };
            this._loglinesArray.push(entry);
            return entry;
        } else {
            this._loglinesArray.push(logline);
            return logline;
        }
    }

    logStep(step){
        this._stepsArray.push(step);   
    }

    // Minimal logger API wrappers, context-aware
    log(message, stepAccumulator) {
        // Optionally decorate message with step info
        this.logger.log(`${message}`);
    }

    logTopic(topic, message, stepAccumulator) {
        this.logger.logTopic(topic, `${message}`);
    }

    logLevel(level, message, stepAccumulator) {
        this.logger.logLevel(level, `${message}`);
    }

    getAccumulatorPrintout(printOptions) {

        let fullJSON = JSON.stringify(this._loglinesArray,null,4);
        this.appendOutputFile("fullJSON.json", fullJSON);
        // Set default options
        printOptions = printOptions || {};
        const printObjects = printOptions.printObjects !== false; // default true
        const prettyObjects = printOptions.prettyObjects !== false; // default true
        const lines = this._loglinesArray.map(entry => {
            //console.log( ":::::DUMP::::::"+JSON.stringify(entry));
            if (printObjects && entry && typeof entry === 'object' && 'logline' in entry && 'bigObject' in entry) {
                let out = entry.logline;
                
                if (entry.bigObject !== undefined) {
                    if (prettyObjects) {
                        out += '\n' + JSON.stringify(entry.bigObject, null, 4);
                    } else {
                        out += '\n' + JSON.stringify(entry.bigObject);
                    }
                }
                return out;
            } else if (typeof entry === 'string') {
                return entry;
            } else if (entry && typeof entry === 'object' && 'logline' in entry) {
                // fallback: just print logline
                return entry.logline;
            } else {
                return String(entry);
            }
        });
        return lines.join("\n")
            + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            + "\n" + ANSIColors.green(Accumulator.getTimeStamp(true))
            + "\n_ID:"+this._ID
            + "\n\n";
    }

    getStepsPrintout(printOptions) {
        printOptions = printOptions || {};
        const printObjects = printOptions.printObjects !== false; // default true
        const prettyObjects = printOptions.prettyObjects !== false; // default true
        const lines = this._stepsArray.map(step => {
            if (!step) return '';
            let icon = step.icon || '';
            // If icon is a string key and Emoji has it, use the emoji symbol
            if (icon && typeof icon === 'string' && Emoji && Object.prototype.hasOwnProperty.call(Emoji, icon)) {
                icon = Emoji[icon];
            }
            const level = step.level || '';
            let out = '';
            if (icon) out += icon + ' ';
            if (level) out += '[' + level + '] ';
            out += (step.stepID ? step.stepID + ': ' : '') + (step.logline || '');
            if (printObjects && step.obj && Object.keys(step.obj).length > 0) {
                if (prettyObjects) {
                    out += '\n' + JSON.stringify(step.obj, null, 4);
                } else {
                    out += '\n' + JSON.stringify(step.obj);
                }
            }
            return out;
        });
        return lines.join("\n")
            + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            + "\n" + ANSIColors.green(Accumulator.getTimeStamp(true))
            + "\n_ID:" + this._ID
            + "\n\n";
    }

    clear() {
        this._loglinesArray = [];
    }

    static getTimeStamp(emitSeconds){
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
        const timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes())  +':'+ (emitSeconds ? pad(now.getSeconds()) : "");
        const dateTimeStr = dateStr + ' ' + timeStr;
        return dateTimeStr;  
    }

    static getInstance() {
        if (!Accumulator._instance) {
            Accumulator._instance = new Accumulator();
        }
        return Accumulator._instance;
    }


    // --- File I/O Wrappers, context-aware ---
    readFileSync(path, options, stepAccumulator) {
        this.accumulate(`readFileSync: ${path}`);
        return readFileSync(path, options);
    }

    writeFileSync(path, data, options, stepAccumulator) {
        this.accumulate(`writeFileSync: ${path}`);
        return writeFileSync(path, data, options);
    }

    readdirSync(path, options, stepAccumulator) {
        this.accumulate(`readdirSync: ${path}`);
        return readdirSync(path, options);
    }

    existsSync(path, stepAccumulator) {
        this.accumulate(`existsSync: ${path}`);
        return existsSync(path);
    }

    appendOutputFile(relPath, data, stepAccumulator) {
        const logline = `💾  ━━━━━━━━━━━━━━━━━━ File appended: ${relPath} ━━━━━━━━━━━━━━━━━━`;
        writeFileSync(relPath, data, { encoding: 'utf8', flag: 'a' });
        this.accumulate(logline);
    }

    appendOutputFiles(printOptions){
        this.appendOutputFile(ACCUMULATOR_LOGLINES,this.getAccumulatorPrintout(printOptions), null);
        this.appendOutputFile(ACCUMULATOR_STEPS,this.getStepsPrintout(printOptions), null);
    }

    hoseAccumulatorOutputFiles(){
        this.#hoseOutputFile(ACCUMULATOR_LOGLINES); 
        this.#hoseOutputFile(ACCUMULATOR_STEPS);   
    }

    /**
     * Private helper to truncate file to zero bytes.
     */
    #hoseOutputFile(relPath) {
        writeFileSync(relPath, '', { encoding: 'utf8', flag: 'w' });
    }

    
    // Factory for StepAccumulator
    static getStepInstance(identity) {
        return new StepAccumulator(identity);
    }

    // Clean exit: flush logger, then exit
    async exit(code = 0) {
        try {
            await this.logger.waitForFlush();
        } catch (e) {
            // Optionally log or handle flush errors
        }
        process.exit(code);
    }
}

