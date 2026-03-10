
import { Accumulator } from '@/bin/namespacer/Accumulator.js';

import StepAccumulator from '@/bin/namespacer/StepAccumulator.js';
import { logVerbose } from './LogVerboseJest.js';

/** Run this test with the  ENV var INFINITE_NECK_VERBOSE, if not in CI but on the command-line to see dump/debug info.
 *    laramie@penguin:~/infinite-neck$ export INFINITE_NECK_VERBOSE=1
 *    laramie@penguin:~/infinite-neck$ node --experimental-vm-modules node_modules/.bin/jest _tests/jest/namespacer/Accumulator.test.js
 *  unset, or set it to 0 to suppress debug info.  
 */

const TEST_STEP_ID = "Accumulator-jest-test";

describe('Accumulator.getStepsPrintout', () => {
    beforeEach(() => {
        // Clear singleton state before each test
        const accumulator = Accumulator.getInstance();
        accumulator.clear();
    });

    
    test('prints accumulated lines and objects (default, true, true)', () => {
        const accumulator = Accumulator.getInstance();
        accumulator.clear();

        const stepAccumulator = Accumulator.getStepInstance(TEST_STEP_ID);
        
        // Info only
        stepAccumulator.logLine('single line');

        // With object
        stepAccumulator.logObject('line with object', { foo: 'bar', bar: 42 });

        // Default options
        let output = accumulator.getStepsPrintout();
        logVerbose(1, "============output1:"+output);
        expect(output).toMatch('single line');
        expect(output).toMatch('line with object');
        expect(output).toMatch(/foo.*bar/);
        expect(output).toMatch(/bar.*42/);
        expect(output).toMatch(/\n\s+"foo": "bar"/); // pretty JSON

        // printObjects: true
        output = accumulator.getStepsPrintout({ printObjects: true });
        logVerbose(1, "===========output2:"+output);
        expect(output).toMatch('line with object');
        expect(output).toMatch(/foo.*bar/);

        // printObjects: true, prettyObjects: true
        output = accumulator.getStepsPrintout({ printObjects: true, prettyObjects: true });
        logVerbose(1, "===========output3:"+output);
        expect(output).toMatch(/\n\s+"foo": "bar"/);
    });

    test('works with StepAccumulator decorator', () => {
        // Clear the global accumulator before using StepAccumulator
        const accumulator = Accumulator.getInstance();
        accumulator.clear();

        const stepAccumulator = Accumulator.getStepInstance(TEST_STEP_ID);
        stepAccumulator.logLine('step line');
        stepAccumulator.logObject('step with object', { foo: 'baz', bar: 99 });

        let output = accumulator.getStepsPrintout({ printObjects: true, prettyObjects: true });
        logVerbose(1, "******output in test*****>>>\n"+output+"<<<*************");
        expect(output).toMatch('step line');
        expect(output).toMatch('step with object');
        expect(output).toMatch(/foo.*baz/);
        expect(output).toMatch(/bar.*99/);
        expect(output).toMatch(/\n\s+"foo": "baz"/);
        
    });
});
