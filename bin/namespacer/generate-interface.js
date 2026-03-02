#!/usr/bin/env node


import { readdir, readFileSync, writeFileSync } from 'fs';
import { extname, join } from 'path';

import * as t from '@babel/types';
//import generate from '@babel/generator';
import { generate } from '@babel/generator';
       

function test(){
    const PLAN_FILEPATH =     "./data/plans/IColorFunction.js.functions.plan";
    const LEGACY_FILEPATH =   "./data/src/colorFunction.js";
    const INTERFACE_NAME =    "IColorFunctions";
    const LEGACY_IMPL_NAME =  "colorFunctionsImpl";

    let methods_plan = Generator.readSourceFileFromCWD(PLAN_FILEPATH);
    const methodLinesArray = Generator.methodListToArray(methods_plan);

    let gen = new Generator();
    let output = gen.generateInterface(LEGACY_FILEPATH, LEGACY_IMPL_NAME, methodLinesArray, INTERFACE_NAME, true);

    console.log("======New IColorFunction class ======\n"+output);
}



export class Generator{

    static readSourceFileFromCWD(relFilePath){
        const absPath = join(process.cwd(), relFilePath);
        return readFileSync(absPath, 'utf8');
    }

    static methodListToArray(methods_onePerLine){
        return methods_onePerLine.split(/\r?\n/).filter(line => line.trim());
    }

    generateInterfaceFromNamespaceObj(namespaceObj, LOG_DEBUG){
        let methods_plan = Generator.readSourceFileFromCWD(namespaceObj.interface);
        const methodLinesArray = Generator.methodListToArray(methods_plan);

        return this.generateInterface(  namespaceObj.sourceout, 
                                        namespaceObj.legacyImpl, 
                                        methodLinesArray, 
                                        namespaceObj.namespace,
                                        LOG_DEBUG);
    }

    /**
     * Generates a class interface source file as a string using Babel AST.
     *
     * @param {string} legacyFilePath - Path to the legacy implementation file (for import).
     * @param {string} legacyImplName - Name to use for the imported legacy implementation.
     * @param {string[]} methodLines - Array of method names to generate, one per method.
     * @param {string} interfaceName - Name of the generated class/interface.
     * @returns {string} The generated JavaScript source code.
     */
    generateInterface(legacyFilePath, legacyImpl, methodLines, interfaceName, LOG_DEBUG) {

        if (LOG_DEBUG) console.log("🌐  Generating Interface for:"
                   +"\n\tlegacyImpl:\t"+legacyImpl
                   +"\n\tinterfaceName:\t"+interfaceName
                   +"\n\tlegacyFilePath:\t"+legacyFilePath
                   +"\n\tmethods:\t"+methodLines.length
        );

        // Import statement: import * as legacyImplName from 'legacyFilePath';
        const importDecl = t.importDeclaration(
            [t.importNamespaceSpecifier(t.identifier(legacyImpl))],
            t.stringLiteral(legacyFilePath.replace(/^\.\/?/, './'))
        );

        // Method definitions
        const methodDefs = methodLines.map(methodName =>
            t.classMethod(
                'method',
                t.identifier(methodName),
                [t.restElement(t.identifier('args'))],
                t.blockStatement([
                    t.returnStatement(
                        t.callExpression(
                            t.memberExpression(
                                t.identifier(legacyImpl),
                                t.identifier(methodName)
                            ),
                            [t.spreadElement(t.identifier('args'))]
                        )
                    )
                ])
            )
        );

        // Class declaration
        const cls = t.classDeclaration(
            t.identifier(interfaceName),
            null,
            t.classBody(methodDefs)
        );

        // Compose the program
        const ast = t.program([
            importDecl,
            cls
        ]);

        // Generate code
        return generate(ast, { quotes: 'single' }).code;
    }
}


//=========== Do it! ===================
//test();