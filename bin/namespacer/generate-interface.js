import { readdir, readFileSync, writeFileSync } from 'fs' ;
import { extname, join } from 'path';

function test(){
    const PLAN_FILEPATH =     "./data/plans/IColorFunction.js.functions.plan";
    const LEGACY_FILEPATH =   "./data/src/colorFunction.js";
    const INTERFACE_NAME = "IColorFunctions";
    const LEGACY_IMPL_NAME = "colorFunctionsImpl";

    let methods_plan = readSourceFile(PLAN_FILEPATH);
    let gen = new GenerateInterface();
    let output = len.generateInterface(LEGACY_FILEPATH, methods_plan);
    console.log("======New IColorFunction class ======\n"+output);
}
function readSourceFile(filePath){
    return readFileSync(filePath, 'utf8');
}

export class GenerateInterface{
   generateInterface(legacyFilePath, methods){
       TODO: 
         generate import statement for legacyFilePath .
         generate one class cls called LEGACY_IMPL_NAME
         for each line in methods, 
            generate one methodDefinition() for cls with args always being like this:
                ...args
            so that every method follows this example:

                clean_ColorSchemeName(...args){
                    return colorFunctionsImpl.clean_ColorSchemeName(...args);
                }
           
         more examples found in this sample output:

             bin/namespacer/data/src/IColorFunctions.js


        the return the result like so: 
          return recast.print(cls).code;     

   }
}