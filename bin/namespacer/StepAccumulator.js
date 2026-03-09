import { Accumulator } from './Accumulator.js';
import { Step } from './Step.js';
// You may need to adjust the import path for Emoji
import {Emoji} from './Emoji.js';

class StepAccumulator {
    constructor(rootStepID) {
        if (!rootStepID || typeof rootStepID !== 'string') {
            throw new Error('StepAccumulator requires a non-empty root stepID');
        }
        this._stepIDStack = [rootStepID];
        this.acc = Accumulator.getInstance();
    }

    pushSubstep(substepID) {
        this._stepIDStack.push(substepID);
        this.logStep(new Step({
            stepID: this.currentStepID(),
            logline: 'entering substep ' + substepID,
            icon: Emoji.SUBSTEP,
            obj: {}
        }));
    }

    popSubstep() {
        // Log before popping
        this.logStep(new Step({
            stepID: this.currentStepID(),
            logline: 'leaving substep ' + this.currentStepID(),
            icon: Emoji.LEAVESTEP,
            obj: {}
        }));
        if (this._stepIDStack.length > 1) {
            this._stepIDStack.pop();
        }
    }

    currentStepID() {
        return this._stepIDStack.join('.');
    }

    logStep(step) {
        if (!step.stepID) {
            step.stepID = this.currentStepID();
        }
        return this.acc.logStep(step);
    }

    logFile(logline, filename) {
        this.logStep(new Step({
            stepID: this.currentStepID(),
            logline,
            icon: Emoji.FILEACCESS,
            obj: { path: filename }
        }));
    }

    logLine(logline) {
        this.logStep(new Step({
            stepID: this.currentStepID(),
            logline,
            icon: Emoji.BEETLE,
            obj: {}
        }));
    }

    logObject(logline, bigObject) {
        this.logStep(new Step({
            stepID: this.currentStepID(),
            logline,
            icon: Emoji.BEETLE,
            obj: bigObject
        }));
    }

    // Pass-through which SHOULD BE DELETED once implementation is done for logStep().
    accumulate(logline) { return this.acc.accumulate(logline); }
    

    // Pass-throughs for legacy/utility
    getAccumulatorPrintout(printOptions) {
        return this.acc.getAccumulatorPrintout(printOptions);
    }
    log(message) { return this.acc.log(message, this); }
    logTopic(topic, message) { return this.acc.logTopic(topic, message, this); }
    logLevel(level, message) { return this.acc.logLevel(level, message, this); }
    readFileSync(filename, options) { return this.acc.readFileSync(filename, options, this); }
    writeFileSync(filename, data, options) { return this.acc.writeFileSync(filename, data, options, this); }
    readdirSync(path, options) { return this.acc.readdirSync(path, options, this); }
    existsSync(path) { return this.acc.existsSync(path, this); }
    appendOutputFile(filename, data, options) { return this.acc.appendOutputFile(filename, data, options, this); }
}

export default StepAccumulator;
