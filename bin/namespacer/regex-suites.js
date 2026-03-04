import { Colors } from './colors.js';

export class RegexSuites {
    constructor(installOtherSuites) {
        if (installOtherSuites){
            this.suites = installOtherSuites;
        } else {
            this.suites = RegexSuites.SUITES_LEGACYJS_TO_ES6;
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
    static FRAMEWORK_FUNCTIONS = [       // List of more identifiers to suppress based on frameworks used (can include regex patterns)
        'alert', 'test', '$', 'rgb', 'makeSong' 
    ];
    
    static FIND_FUNCTIONS =            /^(\s*(?:export\s+)?)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
    static FIND_NON_EXPORT_FUNCTIONS = /^(\s*)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
    static FIND_EXPORT_FUNCTIONS =     /^(\s*export\s+)\s*(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
    static FIND_ALL_EXPORTS =          /^(\s*export\s+)\s*(const|var|let|class|default|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm;
    static FIND_INVOCATIONS =          /(?<!\.|'|"|\b(?:export|const|var|let|class|default|function)\s+)\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
    static FIND_INVOCATION_LINES =     /^((?<!\.|'|"|\b(?:export|const|var|let|class|default|function)\s+).*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\()/gm
    
    
    
    static SUITES_LEGACYJS_TO_ES6 = [
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
            expression: Colors.BQ+'${match[0]}'+Colors.EQ,
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
            expression: Colors.BQ+'${match[0]}'+Colors.EQ,
            bareExpression:'${match[0]}',
            keywords: RegexSuites.SUPPRESS_IDENTIFIERS
        },
        {   
            name: 'invocations',
            regex: RegexSuites.FIND_INVOCATIONS,
            description: 'Find top-level invocations (noLang)',
            expression: Colors.BQ+'${match[0]}'+Colors.EQ,
            bareExpression:'${match[1]}',
            keywords: RegexSuites.SUPPRESS_IDENTIFIERS,
            frameworkFunctions: []
        },
        {   
            name: 'invocations-no-frameworks',
            regex: RegexSuites.FIND_INVOCATIONS,
            description: 'Find top-level invocations (noLang,noFrameworks)',
            expression: Colors.BQ+'${match[0]}'+Colors.EQ,
            bareExpression:'${match[1]}',
            keywords: RegexSuites.SUPPRESS_IDENTIFIERS,
            frameworkFunctions: RegexSuites.FRAMEWORK_FUNCTIONS
        }
    ];
    static formatSuite(oneSuite, sIDx){
        return "Suite["+sIDx+"]:\n" + JSON.stringify(oneSuite, (key, value) =>
                    value instanceof RegExp ? value.toString() : value, 4)
    }

    
    
}
