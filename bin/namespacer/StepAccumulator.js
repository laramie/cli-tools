import { Accumulator } from './Accumulator.js';

class StepAccumulator {
  constructor(identity) {
    this.identity = identity;
    this.acc = Accumulator.getInstance();
    this.step = this.acc.startStep(identity);
  }

  accumulate(...args) {
    return this.acc.accumulate(...args, this);
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
