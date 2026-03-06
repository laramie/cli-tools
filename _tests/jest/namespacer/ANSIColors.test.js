#!/usr/bin/env node

import { ANSIColors } from '@/bin/namespacer/ANSIColors.js';

describe('ANSIColors static tests', () => {
    test('testColors works as expected', () => {
        expect(() => {
            ANSIColors.testColors();
        }).not.toThrow();
        const result = ANSIColors.testColors();
        expect(typeof result).toBe('number');
        expect(result).toBe(20);
    });
});

describe('ANSIColors static tests', () => {
    afterEach(() => {
        // Always reset to default after each test
        ANSIColors.setColor(true);
    });

    test('testColors does not throw', () => {
        expect(() => {
            ANSIColors.testColors();
        }).not.toThrow();
    });

    test('setColor(true) enables coloring, color methods wrap with escapes', () => {
        ANSIColors.setColor(true);
        expect(ANSIColors.isColoring()).toBe(true);
        expect(ANSIColors.red('Hello')).toBe(ANSIColors.Red + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.green('Hello')).toBe(ANSIColors.Green + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.yellow('Hello')).toBe(ANSIColors.Yellow + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.blue('Hello')).toBe(ANSIColors.Blue + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.magenta('Hello')).toBe(ANSIColors.Magenta + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.cyan('Hello')).toBe(ANSIColors.Cyan + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.white('Hello')).toBe(ANSIColors.White + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.black('Hello')).toBe(ANSIColors.Black + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.bgRed('Hello')).toBe(ANSIColors.BgRed + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.bgGreen('Hello')).toBe(ANSIColors.BgGreen + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.bgYellow('Hello')).toBe(ANSIColors.BgYellow + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.bgBlue('Hello')).toBe(ANSIColors.BgBlue + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.bgMagenta('Hello')).toBe(ANSIColors.BgMagenta + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.bgCyan('Hello')).toBe(ANSIColors.BgCyan + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.bgWhite('Hello')).toBe(ANSIColors.BgWhite + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.bgBlack('Hello')).toBe(ANSIColors.BgBlack + 'Hello' + ANSIColors.Reset);
        // Decorations
        expect(ANSIColors.bold('Hello')).toBe(ANSIColors.Bold + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.dim('Hello')).toBe(ANSIColors.Dim + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.underline('Hello')).toBe(ANSIColors.Underline + 'Hello' + ANSIColors.Reset);
        expect(ANSIColors.inverse('Hello')).toBe(ANSIColors.Inverse + 'Hello' + ANSIColors.Reset);
        // Openers
        expect(ANSIColors.bold()).toBe(ANSIColors.Bold);
        expect(ANSIColors.dim()).toBe(ANSIColors.Dim);
        expect(ANSIColors.underline()).toBe(ANSIColors.Underline);
        expect(ANSIColors.inverse()).toBe(ANSIColors.Inverse);
        expect(ANSIColors.reset()).toBe(ANSIColors.Reset);
        // Composition
        const composed = ANSIColors.bold() + ANSIColors.red("I'm bold red.");
        expect(composed.endsWith(ANSIColors.Reset)).toBe(true);
    });

    test('setColor(false) disables coloring, color methods return plain', () => {
        ANSIColors.setColor(false);
        expect(ANSIColors.isColoring()).toBe(false);
        expect(ANSIColors.red('Hello')).toBe('Hello');
        expect(ANSIColors.green('Hello')).toBe('Hello');
        expect(ANSIColors.yellow('Hello')).toBe('Hello');
        expect(ANSIColors.blue('Hello')).toBe('Hello');
        expect(ANSIColors.magenta('Hello')).toBe('Hello');
        expect(ANSIColors.cyan('Hello')).toBe('Hello');
        expect(ANSIColors.white('Hello')).toBe('Hello');
        expect(ANSIColors.black('Hello')).toBe('Hello');
        expect(ANSIColors.bgRed('Hello')).toBe('Hello');
        expect(ANSIColors.bgGreen('Hello')).toBe('Hello');
        expect(ANSIColors.bgYellow('Hello')).toBe('Hello');
        expect(ANSIColors.bgBlue('Hello')).toBe('Hello');
        expect(ANSIColors.bgMagenta('Hello')).toBe('Hello');
        expect(ANSIColors.bgCyan('Hello')).toBe('Hello');
        expect(ANSIColors.bgWhite('Hello')).toBe('Hello');
        expect(ANSIColors.bgBlack('Hello')).toBe('Hello');
        // Decorations
        expect(ANSIColors.bold('Hello')).toBe('Hello');
        expect(ANSIColors.dim('Hello')).toBe('Hello');
        expect(ANSIColors.underline('Hello')).toBe('Hello');
        expect(ANSIColors.inverse('Hello')).toBe('Hello');
        // Openers
        expect(ANSIColors.bold()).toBe('');
        expect(ANSIColors.dim()).toBe('');
        expect(ANSIColors.underline()).toBe('');
        expect(ANSIColors.inverse()).toBe('');
        expect(ANSIColors.reset()).toBe('');
        // Composition
        const composed = ANSIColors.bold() + ANSIColors.red("I'm bold red.");
        expect(composed.endsWith(ANSIColors.Reset)).toBe(false);
    });

    test('getBlame is not empty after setColor calls', () => {
        ANSIColors.setColor(true);
        ANSIColors.setColor(false);
        const blame = ANSIColors.getBlame();
        expect(typeof blame).toBe('string');
        expect(blame && typeof blame.length === 'number' && blame.length > 0).toBe(true);
    });
});