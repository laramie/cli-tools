#!/usr/bin/env node

import { ANSIColors } from './ANSIColors.js';

export class RegexSuites {
    constructor(installOtherSuites) {
        if (installOtherSuites){
            this.suites = installOtherSuites;
        } else {
            this.suites = RegexSuites.LEGACYJS_TO_ES6;
        }
        const validationResult = RegexSuites.validateSuites(this.suites);
        if (validationResult.errors.length > 0) {
            const validationLog = "Suite validation errors: " + JSON.stringify(validationResult, null, 4);
            //console.log(validationLog);
            const err = new Error("RegexSuites validation failed");
            err.validationErrors = validationResult.errors;
            err.keyErrorCount = validationResult.keyErrorCount;
            err.validationLog = validationLog;
            throw err;
        }
    }

    getSuites(){
        return this.suites;
    }

    printSuites(options, printer){
        this.getSuites().forEach((oneSuite, sIDx) => {printer.printInfo(options, RegexSuites.formatSuite(oneSuite, sIDx))});
    }

    printSuiteNames(options, printer){
        this.getSuites().forEach((oneSuite) => {printer.printInfo(options, oneSuite.name)});
    }

    printSuiteNumbers(options, printer){
        this.getSuites().forEach((oneSuite, sIDx) => {printer.printInfo(options, `${sIDx}: ${oneSuite.name}`)});
    }
    
    
    static SUPPRESS_IDENTIFIERS = [       // List of keywords and identifiers to suppress (can include regex patterns)
        'function', 'if', 'switch', 'case', 'while', 'for', 'return', 'typeof', 'isNaN'
    ];

    //TODO: callers must be able to pass in array of more functions that get added to list safely; 
    //    the list will be saved in data/plans/<source-file>.frameworks.plan files for each source-file's exclusions.
    static FRAMEWORK_FUNCTIONS = [       // List of more identifiers to suppress based on frameworks used (can include regex patterns)
        'alert', 'test', '$', 'rgb', 'makeSong'   //TODO: make sure jQuery function $ doesn't need to be escaped.
    ];
    
    static FIND_FUNCTIONS =            /^(\s*(?:export\s+)?)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
    static FIND_NON_EXPORT_FUNCTIONS = /^(\s*)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
    static FIND_EXPORT_FUNCTIONS =     /^(\s*export\s+)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
    static FIND_ALL_EXPORTS =          /^(\s*export\s+)\s*(const|var|let|class|default|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
    static FIND_INVOCATIONS =          /(?<!\.|'|"|\b(?:export|const|var|let|class|default|function)\s+)\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
    static FIND_INVOCATION_LINES =     /^((?<!\.|'|"|\b(?:export|const|var|let|class|default|function)\s+).*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\()/gm
    
    
    
    static LEGACYJS_TO_ES6 = [
        {     
            name: 'functions',
            regex: RegexSuites.FIND_FUNCTIONS,
            description: '[export] function <function-name>',
            expression: '${match[1]}${match[2]} ${match[3]}',
            bareExpression:'${match[3]}' 
        },
        {     
            name: 'functions-no-exports',
            regex: RegexSuites.FIND_NON_EXPORT_FUNCTIONS,
            description: 'function <function-name>',
            expression: '${match[1]}${match[2]} ${match[3]}',
            bareExpression:'${match[3]}' 
        },
        {   
            name: 'function-lines',
            regex: RegexSuites.FIND_FUNCTIONS,
            description: 'Lines with functions in file',
            expression: ANSIColors.BQ+'${match[0]}'+ANSIColors.EQ,
            bareExpression:'${match[0]}' 
        },
        {   
            name: 'export-functions',
            regex: RegexSuites.FIND_EXPORT_FUNCTIONS,
            description: 'export function <function-name>',
            expression: '${match[1]}${match[2]} ${match[3]}',
            bareExpression:'${match[3]}' 
        },
        {   
            name: 'exports',
            regex: RegexSuites.FIND_ALL_EXPORTS,
            description: 'export (const|var|let|class|default|function) <function-name>',
            expression: '${match[1]}${match[2]} ${match[3]}',
            bareExpression:'${match[3]}' 
        },
        {   
            name: 'invocation-lines',
            regex: RegexSuites.FIND_INVOCATION_LINES, 
            description: 'Find top-level invocations (whole line)',
            expression: ANSIColors.BQ+'${match[0]}'+ANSIColors.EQ,
            bareExpression:'${match[0]}',
            keywords: RegexSuites.SUPPRESS_IDENTIFIERS
        },
        {   
            name: 'invocations',
            regex: RegexSuites.FIND_INVOCATIONS,
            description: 'Find top-level invocations (noLang)',
            expression: ANSIColors.BQ+'${match[0]}'+ANSIColors.EQ,
            bareExpression:'${match[1]}',
            keywords: RegexSuites.SUPPRESS_IDENTIFIERS,
            frameworkFunctions: []
        },
        {   
            name: 'invocations-no-frameworks',
            regex: RegexSuites.FIND_INVOCATIONS,
            description: 'Find top-level invocations (noLang,noFrameworks)',
            expression: ANSIColors.BQ+'${match[0]}'+ANSIColors.EQ,
            bareExpression:'${match[1]}',
            keywords: RegexSuites.SUPPRESS_IDENTIFIERS,
            frameworkFunctions: RegexSuites.FRAMEWORK_FUNCTIONS
        }
    ];


    static TEST_MALFORMED = [
        {   
            name: 'malformed-bad-regex',
            regex: '/just a string/',
            description: 'Find top-level invocations (noLang,noFrameworks)',
            expression: ANSIColors.BQ+'${match[0]}'+ANSIColors.EQ,
            bareExpression:'${match[1]}',
            keywords: RegexSuites.SUPPRESS_IDENTIFIERS,
            frameworkFunctions: RegexSuites.FRAMEWORK_FUNCTIONS
        },
        {   
            name: 'malformed-missing-expression',
            regex: '/just a string/',
            description: 'Find top-level invocations (noLang,noFrameworks)',
            bareExpression:'${match[1]}',
            keywords: RegexSuites.SUPPRESS_IDENTIFIERS,
            frameworkFunctions: RegexSuites.FRAMEWORK_FUNCTIONS
        }
    ];
    
    static formatSuite(oneSuite, sIDx){
        return "Suite["+sIDx+"]:\n" + JSON.stringify(oneSuite, (key, value) =>
                    value instanceof RegExp ? value.toString() : value, 4)
    }

    static validateSuites(suites) {
        const errors = [];
        let keyErrorCount = 0;
        const requiredFields = [
            { key: 'name', type: 'string' },
            { key: 'regex', type: 'object' }, // RegExp is typeof 'object'
            { key: 'description', type: 'string' },
            { key: 'expression', type: 'string' },
            { key: 'bareExpression', type: 'string' }
        ];
        suites.forEach((suite, idx) => {
            const suiteErrors = [];
            // Check required fields
            for (const field of requiredFields) {
                if (!(field.key in suite)) {
                    suiteErrors.push({
                        key: field.key,
                        error: `missing required field: ${field.key}`
                    });
                    keyErrorCount++;
                } else if (typeof suite[field.key] !== field.type) {
                    suiteErrors.push({
                        key: field.key,
                        error: `field '${field.key}' should be of type ${field.type}`
                    });
                    keyErrorCount++;
                }
            }
            // Optional fields
            if ('keywords' in suite && !Array.isArray(suite.keywords)) {
                suiteErrors.push({
                    key: 'keywords',
                    error: "field 'keywords' should be an array"
                });
                keyErrorCount++;
            }
            if ('frameworkFunctions' in suite && !Array.isArray(suite.frameworkFunctions)) {
                suiteErrors.push({
                    key: 'frameworkFunctions',
                    error: "field 'frameworkFunctions' should be an array"
                });
                keyErrorCount++;
            }
            // RegExp check
            if ('regex' in suite && !(suite.regex instanceof RegExp)) {
                suiteErrors.push({
                    key: 'regex',
                    error: "field 'regex' should be a RegExp"
                });
                keyErrorCount++;
            }
            if (suiteErrors.length > 0) {
                errors.push({
                    suiteIdx: idx,
                    name: suite.name || "(no name)",
                    errors: suiteErrors
                });
            }
        });
        return { errors, keyErrorCount };
    }
    

    static testMalformedSuites(){
        let badSuites = new RegexSuites(RegexSuites.TEST_MALFORMED);
    }
    static testDefaultSuites(){
        let goodSuites = new RegexSuites(RegexSuites.LEGACYJS_TO_ES6);
    }
    
    
}



