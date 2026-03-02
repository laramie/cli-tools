#!/usr/bin/env node


import { readdir, readFileSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import jscodeshift from 'jscodeshift';

       

function test(){
    const PLAN_FILEPATH =     "./data/plans/IColorFunction.js.functions.plan";
    const LEGACY_FILEPATH =   "./data/src/colorFunction.js";
    const INTERFACE_NAME =    "IColorFunctions";
    const LEGACY_IMPL_NAME =  "colorFunctionsImpl";

    let methods_plan = readSourceFile(PLAN_FILEPATH);
    const methodLinesArray = methods_plan.split(/\r?\n/).filter(line => line.trim());
    methodLinesArray.map(methodName =>
        console.log(" in map methodName==>"+methodName+"<==")
    );

    let gen = new Generator();
    let output = gen.generateInterface(LEGACY_FILEPATH, LEGACY_IMPL_NAME, methodLinesArray, INTERFACE_NAME);

    console.log("======New IColorFunction class ======\n"+output);
}
function readSourceFile(filePath){
    console.log("cwd: "+process.cwd());
    console.log("rel filePath: "+filePath);
    // Resolve filePath relative to the current working directory
    const absPath = join(process.cwd(), filePath);
    console.log("absPath: "+absPath);
    return readFileSync(absPath, 'utf8');
}

export class Generator{
    generateInterface(legacyFilePath, legacyImplName, methodLinesArray, interfaceName) {
        return "not implemented";
    }
}

//=========== Do it! ===================
test();