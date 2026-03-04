#!/usr/bin/env node

import { RegexSuites } from '../../../bin/namespacer/RegexSuites.js';

describe('RegexSuites static tests', () => {
    test('testMalformedSuites throws as expected', () => {
        expect(() => {
            RegexSuites.testMalformedSuites();
        }).toThrow();
    });
});
