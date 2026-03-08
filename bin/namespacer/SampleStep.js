#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { Accumulator } from './Accumulator.js';

const  TESTFILE = "data/src/song.js";
const  TESTFILEOUT = "data/src/song.js.gen";

export class SampleStep {
  constructor() {
    this.identity = { className: "SampleStep", topFile: TESTFILE, step: "demo" };
  }

  

  run() {
    const stepAccumulator = Accumulator.getStepInstance(this.identity);
    try {
      stepAccumulator.accumulate("Starting step");
      stepAccumulator.log("Log message");
      stepAccumulator.logTopic("topic1", "Topic log message");
      stepAccumulator.logLevel("info", "Info log message");
      let contents = stepAccumulator.readFileSync(TESTFILE);
      stepAccumulator.writeFileSync(TESTFILEOUT, contents);
      stepAccumulator.readdirSync(".");
      stepAccumulator.existsSync(TESTFILE);
      stepAccumulator.appendOutputFile("output.txt", "Appended data");
    } finally {
      stepAccumulator.leave();
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    let realAccumulator = Accumulator.getInstance();
    realAccumulator.accumulate("starting SampleStep");
    const step = new SampleStep();
    step.run();
    realAccumulator.accumulate("ending SampleStep");
    const printOptions = { printObjects: true, prettyObjects: true };
    console.log(realAccumulator.getAccumulatorPrintout(printOptions));
    realAccumulator.exit(0);
}
