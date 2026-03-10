#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { Accumulator } from './Accumulator.js';

const  TESTFILE = "data/src/song.js";
const  TESTFILEOUT = "data/src/song.js.gen";

export class SampleStep {
  constructor(stepAccumulator) {
    this.stepAccumulator = stepAccumulator;
  }

  

  run() {
      this.stepAccumulator.logLine("Starting step");
      this.stepAccumulator.log("Log message");
      this.stepAccumulator.logTopic("topic1", "Topic log message");
      this.stepAccumulator.logLevel("info", "Info log message");
      let contents = this.stepAccumulator.readFileSync(TESTFILE);
      this.stepAccumulator.writeFileSync(TESTFILEOUT, contents);
      this.stepAccumulator.readdirSync(".");
      this.stepAccumulator.existsSync(TESTFILE);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const SAMPLESTEP_ID = "SampleStep-test";
    let realAccumulator = Accumulator.getInstance();
    realAccumulator.log("Starting "+SAMPLESTEP_ID);
    const stepAccumulator = Accumulator.getStepInstance(SAMPLESTEP_ID);
    const step = new SampleStep(stepAccumulator);
    step.run();
    realAccumulator.log("Ending "+SAMPLESTEP_ID);
    const printOptions = { printObjects: true, prettyObjects: true };
    console.log(realAccumulator.getStepsPrintout(printOptions));
    realAccumulator.exit(0);
}
