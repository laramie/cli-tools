
// Accumulator.js - ES6 Singleton Accumulator for plan logging
import { ANSIColors } from './ANSIColors.js';
import { Emoji } from './Emoji.js';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { Logger } from './Logger.js';
import { Step } from './Step.js';
import { StepAccumulator } from './StepAccumulator.js';

const ACCUMULATOR_STEPS    = "_accumulator.steps.json";




export class Accumulator {
    constructor() {
        if (Accumulator._instance) {
            return Accumulator._instance;
        }
        this._loglinesArray = [];
        this._stepsArray = [];
        this.logger = Logger.getInstance();
        Accumulator._instance = this;
        this.#logAccumulatorHeader();
    }

    static getInstance() {
        if (!Accumulator._instance) {
            Accumulator._instance = new Accumulator();
        }
        return Accumulator._instance;
    }

    /**
     * Resets the Accumulator singleton instance. Useful for test isolation or reconfiguration.
     * Optionally accepts loggerOptions to reconfigure the logger as well.
     */
    static resetInstance(loggerOptions) {
        // Optionally reset Logger singleton as well if loggerOptions provided
        if (loggerOptions && Logger.resetInstance) {
            Logger.resetInstance(loggerOptions);
        }
        Accumulator._instance = null;
    }

    // Accepts stepID, returns indentation based on dot count
    indent(stepID) {
        if (!stepID || typeof stepID !== 'string') return '';
        const dotCount = (stepID.match(/\./g) || []).length;
        return '      '.repeat(dotCount); // 6 spaces per dot
    }

    logStep(step){
        this._stepsArray.push(step);   
    }

    setLoggerOptions(options){
        // Re-instantiate the Logger singleton with new options
        // Logger.getInstance will return a new instance if options are passed
        this.logger = Logger.getInstance(options);
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

    //called in constructor:
    #logAccumulatorHeader(){
        const logline = "Accumulated Plan. Run: "+ANSIColors.cyan(Accumulator.getTimeStamp(true))
            +(ANSIColors.isColoring() 
            ?   "\n  --color :: View as 'cat <filename>' or 'less -R <filename>'"
            :  ""
        );
        const step = new Step({stepID: "Accumulator", logline: logline, icon: Emoji.ACCUMULATOR});
        this.logStep(step);                
    }
    
    #logAccumulatorFooter() {
        const logline = "END. "+ANSIColors.green(Accumulator.getTimeStamp(true));
        const step = new Step({stepID: "Accumulator", logline: logline, icon: Emoji.ACCUMULATOR});
        this.logStep(step);  
    }
    
    getStepsPrintout(printOptions) {
        this.#logAccumulatorFooter();
        printOptions = printOptions || {};
        // Filter by log level if specified
        let steps = this._stepsArray;
        if (printOptions.level) {
            const minLevel = (typeof Step !== 'undefined' && Step.levelToInt)
                ? Step.levelToInt(printOptions.level)
                : 20; // fallback to INFO
            steps = steps.filter(step => {
                // If step.level is missing, treat as INFO
                const stepLevel = (typeof Step !== 'undefined' && Step.levelToInt)
                    ? Step.levelToInt(step.level)
                    : 20;
                return stepLevel >= minLevel;
            });
        }
        if (printOptions.oneLiner === true) {
            // One-liner: icon indent(stepID) currentStepID :: logline path {...} or object if showOneLinerObjects
            return steps.map(step => {
                if (!step) return '';
                const stepIndent = this.indent(step.stepID)+'    ';
                const icon = step.icon || '';
                const stepID = step.stepID || '';
                const logline = step.logline || '';
                let path = '';
                if (step.path) {
                    path = step.path;
                } else if (step.obj && typeof step.obj === 'object' && step.obj.path) {
                    path = step.obj.path;
                }
                let objStr = '';
                if (step.obj && typeof step.obj === 'object' && Object.keys(step.obj).length > 0) {
                    if (printOptions.showOneLinerObjects) {
                        try {
                            if (printOptions.prettyObjects) {
                                objStr = ' ' + JSON.stringify(step.obj, null, 4).split('\n').join('\n' + stepIndent);
                            } else {
                                objStr = ' ' + JSON.stringify(step.obj);
                            }
                        } catch (e) {
                            objStr = ' {object}';
                        }
                    } else {
                        objStr = ' {...}';
                    }
                }
                return `${icon}  ${this.indent(stepID)}${stepID} ${ANSIColors.Dim+ANSIColors.cyan("::")} ${logline}${path ? ' ' + ANSIColors.yellow(path) : ''}${ANSIColors.green(objStr)}`.trim();
            }).join('\n');
        }
        const printObjects = printOptions.printObjects !== false; // default true
        const objectKeysOnly = printOptions.objectKeysOnly === true;
        const objectSquash = printOptions.objectSquash === true;
        const mappedSteps = steps.map(step => {
            if (!step) return step;
            let newStep = { ...step };
            if (!printObjects) {
                // Omit obj
                delete newStep.obj;
            } else if (objectSquash && newStep.obj && typeof newStep.obj === 'object' && !Array.isArray(newStep.obj)) {
                // Squash all first-level properties into a string
                const keys = Object.keys(newStep.obj);
                let parts = [];
                for (let i = 0; i < keys.length && i < 4; ++i) {
                    let k = keys[i];
                    let v = newStep.obj[k];
                    let vStr = (v === undefined) ? '' : String(v);
                    // Escape quotes
                    vStr = vStr.replace(/"/g, '\"');
                    if (vStr.length > 32) {
                        vStr = vStr.slice(0, 29) + '...more';
                    }
                    parts.push(`${k}:${vStr}`);
                }
                if (keys.length > 4) {
                    parts.push('...moreKeys');
                }
                const squashString = parts.join(',');
                delete newStep.obj;
                newStep.objectSquash = squashString;
            } else if (objectKeysOnly && newStep.obj && typeof newStep.obj === 'object' && !Array.isArray(newStep.obj)) {
                // Replace obj with a single string of comma-separated keys, and rename property
                const keysString = Object.keys(newStep.obj).join(',');
                delete newStep.obj;
                newStep.objectKeysOnly = keysString;
            }
            return newStep;
        });
        try {
            return JSON.stringify(mappedSteps, null, 4);
        } catch (e) {
            // Fallback: emit an empty array if serialization fails
            return '[]';
        }
    }

    clear() {
        this._loglinesArray = [];
        this._stepsArray = [];
    }

    static getTimeStamp(emitSeconds){
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
        const timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes())  +':'+ (emitSeconds ? pad(now.getSeconds()) : "");
        const dateTimeStr = dateStr + ' ' + timeStr;
        return dateTimeStr;  
    }

    

    #logFileIO(opp, path, stepAccumulator){
        //const step = new Step({stepID: "Accumulator."+stepAccumulator.currentStepID(), logline: opp, path: path, icon: Emoji.IO});
        const step = new Step({stepID: ANSIColors.Dim+ANSIColors.cyan("Accumulator."), logline: ANSIColors.Dim+ANSIColors.cyan(opp), path: ANSIColors.blue(path), icon: Emoji.IO, level: 'debug'});
        this.logStep(step);
    }

    // --- File I/O Wrappers, context-aware ---
    readFileSync(path, options, stepAccumulator) {
        this.#logFileIO("readFileSync", path, stepAccumulator);
        return readFileSync(path, options);
    }

    writeFileSync(path, data, options, stepAccumulator) {
        this.#logFileIO("writeFileSync", path, stepAccumulator);
        return writeFileSync(path, data, options);
    }

    readdirSync(path, options, stepAccumulator) {
        this.#logFileIO("readdirSync", path, stepAccumulator);
        return readdirSync(path, options);
    }

    existsSync(path, stepAccumulator) {
        this.#logFileIO("existsSync", path, stepAccumulator);
        return existsSync(path);
    }

    appendOutputFile(relPath, data, stepAccumulator) {
        const logline = `💾  ━━━━━━━━━━━━━━━━━━ File appended: ${relPath} ━━━━━━━━━━━━━━━━━━`;
        writeFileSync(relPath, data, { encoding: 'utf8', flag: 'a' });
        this.log(logline);
    }

    appendOutputFiles(printOptions){
        this.appendOutputFile(ACCUMULATOR_STEPS,this.getStepsPrintout(printOptions), null);
    }

    hoseAccumulatorOutputFiles(){
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

