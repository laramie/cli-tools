
import { Accumulator } from '@/bin/namespacer/Accumulator.js';
import StepAccumulator from '@/bin/namespacer/StepAccumulator.js';

/** Run this test with the  ENV var INFINITE_NECK_VERBOSE, if not in CI but on the command-line to see dump/debug info.
 *    laramie@penguin:~/infinite-neck$ export INFINITE_NECK_VERBOSE=1
 *    laramie@penguin:~/infinite-neck$ node --experimental-vm-modules node_modules/.bin/jest _tests/jest/namespacer/Accumulator.test.js
 *  unset, or set it to 0 to suppress debug info.  
 */

// Minimal verbose logging setup
const INFINITE_NECK_VERBOSE = process.env.INFINITE_NECK_VERBOSE;
const VERBOSE_MODE_INT = parseInt(INFINITE_NECK_VERBOSE, 10);
const VERBOSE_MODE = isNaN(VERBOSE_MODE_INT) ? 0 : VERBOSE_MODE_INT;
function logVerbose(level, msg) {
    if (VERBOSE_MODE === -1) return;
    if (VERBOSE_MODE >= level) console.log(msg);
}

describe('Accumulator.getAccumulatorPrintout', () => {
    beforeEach(() => {
        // Clear singleton state before each test
        const accumulator = Accumulator.getInstance();
        accumulator.clear();
    });

    
    test('prints accumulated lines and objects (default, true, true)', () => {
        const accumulator = Accumulator.getInstance();
        accumulator.clear();
        accumulator.accumulate('single line');
        accumulator.accumulate('line with object', { foo: 'bar', bar: 42 });

        // Default options
        let output = accumulator.getAccumulatorPrintout();
        logVerbose(1, "============output1:"+output);
        expect(output).toMatch('single line');
        expect(output).toMatch('line with object');
        expect(output).toMatch(/foo.*bar/);
        expect(output).toMatch(/bar.*42/);
        expect(output).toMatch(/\n\s+"foo": "bar"/); // pretty JSON

        // printObjects: true
        output = accumulator.getAccumulatorPrintout({ printObjects: true });
        logVerbose(1, "===========output2:"+output);
        expect(output).toMatch('line with object');
        expect(output).toMatch(/foo.*bar/);

        // printObjects: true, prettyObjects: true
        output = accumulator.getAccumulatorPrintout({ printObjects: true, prettyObjects: true });
        logVerbose(1, "===========output3:"+output);
        expect(output).toMatch(/\n\s+"foo": "bar"/);
    });

    test('works with StepAccumulator decorator', () => {
        // Clear the global accumulator before using StepAccumulator
        const accumulator = Accumulator.getInstance();
        accumulator.clear();
        const replacerStepAccumulator = Accumulator.getStepInstance('Replacer');
        replacerStepAccumulator.accumulate('step line');
        replacerStepAccumulator.accumulate('step with object', { foo: 'baz', bar: 99 });

        let output = replacerStepAccumulator.getAccumulatorPrintout();
        logVerbose(1, "******output in test*****>>>\n"+output+"<<<*************");
        expect(output).toMatch('step line');
        expect(output).toMatch('step with object');
        expect(output).toMatch(/foo.*baz/);
        expect(output).toMatch(/bar.*99/);
        expect(output).toMatch(/\n\s+"foo": "baz"/);
        
    });
});
