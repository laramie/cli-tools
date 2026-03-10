// SampleStep.test.js
// This file is a Jest test for SampleStep, with logging setup copied from Accumulator.test.js

import { fileURLToPath } from 'url';
import { Accumulator } from '../../../bin/namespacer/Accumulator.js';
import { SampleStep } from './SampleStep.js';


import { logVerbose } from './LogVerboseJest.js';

const SAMPLESTEP_ID = "SampleStep-jest-test";

describe('SampleStep.run', () => {
    beforeEach(() => {
        // Clear singleton state before each test
        const accumulator = Accumulator.getInstance();
        accumulator.clear();
    });

    test('runs SampleStep and logs output', () => {
        const realAccumulator = Accumulator.getInstance();
        realAccumulator.log("Starting "+SAMPLESTEP_ID);
        const stepAccumulator = Accumulator.getStepInstance(SAMPLESTEP_ID);
        const step = new SampleStep(stepAccumulator);

        //======= This runs SampleStep.js::run() so go look there to see what log statements and strings it issues.
        step.run();

        realAccumulator.log("Ending "+SAMPLESTEP_ID);
        const printOptions = { printObjects: true, prettyObjects: true, oneLiner: true };
        const output = realAccumulator.getStepsPrintout(printOptions);
        logVerbose(1, "******output in test*****>>>\n"+output+"<<<*************");
        expect(output).toMatch('Starting step');
        // The following are not expected in output, as they go to Logger, not Accumulator:
        expect(output).not.toMatch('Log message');
        expect(output).not.toMatch('Topic log message');
        expect(output).not.toMatch('Info log message');
        // You may want to add more expectations based on the file operations if needed
    });
});
