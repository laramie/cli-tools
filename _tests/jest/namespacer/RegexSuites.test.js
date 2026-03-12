#!/usr/bin/env node


import { RegexSuites } from '../../../bin/namespacer/RegexSuites.js';
import { logVerbose } from '../LogVerboseJest.js';


describe('RegexSuites static tests', () => {
    test('testMalformedSuites throws as expected and error count matches', () => {
        try {
            RegexSuites.testMalformedSuites();
            throw new Error('Expected error was not thrown');
        } catch (err) {
            expect(err.validationErrors).toBeDefined();
            expect(Array.isArray(err.validationErrors)).toBe(true);
            expect(err.validationErrors.length).toBe(2); // Update if you change the malformed suite count
            expect(err.keyErrorCount).toBe(5); // Update if you change the number of key errors
            // Optionally, check the structure of the errors
            expect(err.validationErrors[0]).toHaveProperty('suiteIdx');
            expect(err.validationErrors[0]).toHaveProperty('errors');
            logVerbose(1,"err.validationLogFOO:"+err.validationLog);
        }
    });
    test('testDefaultSuites succeeds', () => {
        expect(() => {
            RegexSuites.testDefaultSuites();
        }).not.toThrow();
    });
});
