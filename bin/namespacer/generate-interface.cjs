#!/usr/bin/env node

const { readdir, readFileSync, writeFileSync } = require('fs');
const { extname, join } = require('path');
const recast = require('recast');
 /**
  * 
  * 
  * 
  * 
  * 
  *     THIS IS THE COMMON JS VERSION OF THIS FILE !!!!!!!!!!!!!
  * 
  * 
  * 
  * 
  */
       

function test(){
    const PLAN_FILEPATH =     "./data/plans/IColorFunction.js.functions.plan";
    const LEGACY_FILEPATH =   "./data/src/colorFunction.js";
    const INTERFACE_NAME =    "IColorFunctions";
    const LEGACY_IMPL_NAME =  "colorFunctionsImpl";

    let methods_plan = readSourceFile(PLAN_FILEPATH);
    console.log("methods_plan==>"+methods_plan+"<==");

    let gen = new Generator();
    let output = gen.generateInterface(LEGACY_FILEPATH, LEGACY_IMPL_NAME, methods_plan, INTERFACE_NAME);

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

class Generator{
   generateInterface(legacyFilePath, legacyImplName, methods_plan, interfaceName) {
       const b = recast.types.builders;

       // Generate import statement
       const importDecl = b.importDeclaration(
           [b.importNamespaceSpecifier(b.identifier(legacyImplName))],
           b.literal(legacyFilePath.replace(/^\.\/?/, './'))
       );

       // Prepare method definitions
       const methodLines = methods_plan.split(/\r?\n/).filter(line => line.trim());
       console.log("LEN: "+methodLines.length);

       methodLines.map(methodName =>
        console.log(" in map methoName==>"+methodName+"<==")
       );

       const methodDefs = methodLines.map(methodName => {
            console.log("in methodLines.map loop:"+methodName);
            b.methodDefinition(
               'method',
               b.identifier(methodName),
               b.functionExpression(
                   null,
                   [b.restElement(b.identifier('args'))],
                   b.blockStatement([
                       b.returnStatement(
                           b.callExpression(
                               b.memberExpression(
                                   b.identifier(legacyImplName),
                                   b.identifier(methodName),
                                   false
                               ),
                               [b.spreadElement(b.identifier('args'))]
                           )
                       )
                   ])
               )
           )
        });

       console.log("b:"+JSON.stringify(b,null,2));
       // Generate class declaration
       const cls = b.classDeclaration(
           b.identifier(interfaceName),
           null,
           b.classBody(methodDefs)
       );

       // Compose the program
       const ast = b.program([
           importDecl,
           cls
       ]);

       return recast.print(ast).code;
   }
}

//=========== Do it! ===================
test();