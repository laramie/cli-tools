import { Accumulator } from './Accumulator.js';

class StepAccumulator {
    getAccumulatorPrintout(options) {
      return this.acc.getAccumulatorPrintout(options);
    }
  constructor(identity) {
    this.identity = identity;
    this.acc = Accumulator.getInstance();
    this.step = this.acc.startStep(identity);
  }

  accumulate(...args) {
    //console.log("~~~~~~~~~~~~~~~~~~~~~~~~~accumulate in StepAccumulator~~~~~:"+JSON.stringify(args));
      
    if (args.length === 1) {
      // Only logline provided: decorate with stepID
      return this.acc.accumulate(args[0], { stepID: this.identity });
    } else if (args.length === 2) {
      // logline and bigObject provided: wrap bigObject with stepID
      return this.acc.accumulate(args[0], { stepID: this.identity, bigObject: args[1] });
    } else {
      // Fallback: pass all args as-is
      //console.log("~~~~~~~~~~~~~~~~~~~~~~~~~FALLBACK in StepAccumulator~~~~~:"+(args));
      return this.acc.accumulate(...args);
    }
  }

  log(message) {
    return this.acc.log(message, this);
  }

  logTopic(topic, message) {
    return this.acc.logTopic(topic, message, this);
  }

  logLevel(level, message) {
    return this.acc.logLevel(level, message, this);
  }

  readFileSync(filename, options) {
    return this.acc.readFileSync(filename, options, this);
  }

  writeFileSync(filename, data, options) {
    return this.acc.writeFileSync(filename, data, options, this);
  }

  readdirSync(path, options) {
    return this.acc.readdirSync(path, options, this);
  }

  existsSync(path) {
    return this.acc.existsSync(path, this);
  }

  appendOutputFile(filename, data, options) {
    return this.acc.appendOutputFile(filename, data, options, this);
  }

  leave() {
    this.acc.endStep(this.step);
  }
}

export default StepAccumulator;
