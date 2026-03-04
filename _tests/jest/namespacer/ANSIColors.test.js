#!/usr/bin/env node

import { ANSIColors } from '../../../bin/namespacer/ANSIColors.js';

describe('ANSIColor static tests', () => {
    test('testColors works as expected', () => {
        expect(() => {
            ANSIColors.testColors();
        }).not.toThrow();
        const result = ANSIColors.testColors();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(10);
    });
});