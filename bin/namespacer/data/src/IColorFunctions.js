import * as colorFunctionsImpl from './colorFunctions.js';s

class IColorFunctions {
	
	clean_ColorSchemeName(...args){
		return colorFunctionsImpl.clean_ColorSchemeName(...args);
	}
	recordUserColorsBoth(...args){
		return colorFunctionsImpl.recordUserColorsBoth(...args);
	}
	recordUserColors(...args){
		return colorFunctionsImpl.recordUserColors(...args);
	}
	recordUserColorsFromSection(...args){
		return colorFunctionsImpl.recordUserColorsFromSection(...args);
	}
	saveUserColorChoices(...args){
		return colorFunctionsImpl.saveUserColorChoices(...args);
	}
}