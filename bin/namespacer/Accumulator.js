// Accumulator.js - ES6 Singleton Accumulator for plan logging
import { ANSIColors } from './ANSIColors.js';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { Logger } from './Logger.js';
import StepAccumulator from './StepAccumulator.js';

let _GID = 1;

export class Accumulator {
    constructor() {
        if (Accumulator._instance) {
            return Accumulator._instance;
        }
        this._ID = _GID++;
        this._planAccumulator = [];
        this.logger = Logger.getInstance();
        Accumulator._instance = this;
    }

    accumulate(logline) {
        //console.log("++++++++++++++++++Accumulator.accumulate:::"+logline+":::");
        if (arguments.length > 1) {
            const bigObject = arguments[1];
            const entry = { logline, bigObject };
            this._planAccumulator.push(entry);
            return entry;
        } else {
            this._planAccumulator.push(logline);
            return logline;
        }
    }

    // Minimal logger API wrappers, context-aware
    log(message, stepAccumulator) {
        // Optionally decorate message with step info
        this.logger.log(`[${this._stepTag(stepAccumulator)}] ${message}`);
    }

    logTopic(topic, message, stepAccumulator) {
        this.logger.logTopic(topic, `[${this._stepTag(stepAccumulator)}] ${message}`);
    }

    logLevel(level, message, stepAccumulator) {
        this.logger.logLevel(level, `[${this._stepTag(stepAccumulator)}] ${message}`);
    }

    getAccumulatorPrintout(options) {

        let fullJSON = JSON.stringify(this._planAccumulator,null,4);
        this.appendOutputFile("fullJSON.json", fullJSON);
        // Set default options
        options = options || {};
        const printObjects = options.printObjects !== false; // default true
        const prettyObjects = options.prettyObjects !== false; // default true
        const lines = this._planAccumulator.map(entry => {
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

    clear() {
        this._planAccumulator = [];
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
        this.accumulate(`readFileSync: ${path} [${this._stepTag(stepAccumulator)}]`);
        return readFileSync(path, options);
    }

    writeFileSync(path, data, options, stepAccumulator) {
        this.accumulate(`writeFileSync: ${path} [${this._stepTag(stepAccumulator)}]`);
        return writeFileSync(path, data, options);
    }

    readdirSync(path, options, stepAccumulator) {
        this.accumulate(`readdirSync: ${path} [${this._stepTag(stepAccumulator)}]`);
        return readdirSync(path, options);
    }

    existsSync(path, stepAccumulator) {
        this.accumulate(`existsSync: ${path} [${this._stepTag(stepAccumulator)}]`);
        return existsSync(path);
    }

    appendOutputFile(relPath, data, stepAccumulator) {
        const logline = `💾  ━━━━━━━━━━━━━━━━━━ File appended: ${relPath} [${this._stepTag(stepAccumulator)}] ━━━━━━━━━━━━━━━━━━`;
        writeFileSync(relPath, data, { encoding: 'utf8', flag: 'a' });
        this.accumulate(logline);
    }
    
    // Step management for StepAccumulator
    startStep(identity) {
        const step = { identity, actions: [] };
        //this._planAccumulator.push("stepStart", { type: 'stepStart', identify: identity });
        this.accumulate("stepStart", { type: 'stepStart', identify: identity });
        return step;
    }

    endStep(step) {
        this.accumulate("endStep", { type: 'stepEnd', identity: step.identity, actions: step.actions });
    }

    _stepTag(stepAccumulator) {
        if (!stepAccumulator || !stepAccumulator.identity) return 'no-step';
        const id = stepAccumulator.identity;
        return `${id.className || ''}:${id.topFile || ''}:${id.step || ''}`;
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

