import { Accumulator } from './Accumulator.js';
import { Step } from './Step.js';
// You may need to adjust the import path for Emoji
import {Emoji} from './Emoji.js';

export class StepAccumulator {
    constructor(rootStepID) {
        if (!rootStepID || typeof rootStepID !== 'string') {
            throw new Error('StepAccumulator requires a non-empty root stepID');
        }
        this._stepIDStack = [rootStepID];
        this.acc = Accumulator.getInstance();
    }

    newStepLogline(logline, icon){
        return this.newStep({ logline, icon });
    }

    newStep(stepProps){
        const params = { ...(stepProps || {}) };

        if (!params.stepID) {
            params.stepID = this.currentStepID();
        }
        if (!params.icon) {
            params.icon = Emoji.BULLET;
        }
        if (!Object.prototype.hasOwnProperty.call(params, 'obj')) {
            params.obj = {};
        }

        return new Step(params);
    }

    pushSubstep(substepID, optionalMessage) {
        const theLogline = `entering substep ${substepID}` + (optionalMessage ? `: ${optionalMessage}` : "");
        this.logStep(new Step({
            stepID: this.currentStepID(),
            logline: theLogline,
            icon: Emoji.SUBSTEP,
            obj: {}
        }));
        this._stepIDStack.push(substepID);
        
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

    indent(){
      return " ".repeat((this._stepIDStack.length - 1) * 4);
    }

    logStep(step) {
        if (!step.stepID) {
            step.stepID = this.currentStepID();
        }
        return this.acc.logStep(step);
    }

    logFile(logline, filename, icon = Emoji.FILEACCESS) {
        this.logStep(new Step({
            stepID: this.currentStepID(),
            logline,
            icon,
            path: filename,
            obj: {}
        }));
    }

    logLine(logline, icon = Emoji.BEETLE) {
        this.logStep(new Step({
            stepID: this.currentStepID(),
            logline,
            icon: icon,
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


    // Pass-throughs for legacy/utility
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
