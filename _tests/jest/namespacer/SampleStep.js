#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import { Accumulator } from '../../../bin/namespacer/Accumulator.js';

// Adjust file paths to be relative to project root
// Use import.meta.url to resolve paths relative to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');
const namespacerReldir = 'bin/namespacer';
const TESTFILE = path.join(projectRoot, namespacerReldir, 'data/src/song.js');
const TESTFILEOUT = path.join(projectRoot, namespacerReldir, 'data/src/song.js.gen');

/*  Now, there are two ways to run this file:
      cd _tests/jest/namespacer/
      node --experimental-vm-modules SampleStep.js
      cd ../../..
      node --experimental-vm-modules _tests/jest/namespacer/SampleStep.js
*/    

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
    Accumulator.resetInstance({ level: 'warn' });
    let realAccumulator = Accumulator.getInstance();
    realAccumulator.log("Starting "+SAMPLESTEP_ID);
    const stepAccumulator = Accumulator.getStepInstance(SAMPLESTEP_ID);
    const step = new SampleStep(stepAccumulator);
    step.run();
    realAccumulator.log("Ending "+SAMPLESTEP_ID);
    const printOptions = { printObjects: true, prettyObjects: true, oneLiner: true };
    console.log(realAccumulator.getStepsPrintout(printOptions));
    realAccumulator.exit(0);
}
