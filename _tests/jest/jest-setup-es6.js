// _tests/jest/jest-setup-es6.js
// ES6 module-based Jest setup for infinite-neck project
// Loads all dependencies using import statements

import { chuseStylesheet, recordUserColors, recordUserColorsFromSection, applyStylesheetsTo_gUserColorDict, buildColorDicts, buildUserColors } from '../../colorFunctions.js';
import { gColorPickerColors } from '../../colorPickerColors.js';
import { txtCmdLine_keypress } from '../../command-line.js';
import '../../display-options.js';
import { draggable } from '../../drag.js';
import { makeGraveyard } from '../../graveyard.js';
import { getFontSize, getNoteFontSize, setSectionKeysFlats, setSectionKeysSharps, document_keypress, document_keyup } from '../../key-handlers.js';
import '../../looper.js';
import '../../menu.js';
import { Note } from '../../note.js';
import { NoteTableFacade } from '../../NoteTableFacade.js';
import { makeSong } from '../../song.js';
import '../../section-recorder.js';
import '../../svgLines.js';
import { auditThemes, clearThemeDiffResults, getDefaultTheme, getThemes, getWidget_SelectThemes, setOneCssVar, theme, themeToControls } from '../../themeFunctions.js';
import { TableBuilder } from '../../TableBuilder.js';
import { allTunings } from '../../tunings.js';
import { gUserColorDict, gUserColorDictRolesDefault, gUserColorDictFingeringsDefault, gDefault_CycleOfColors, gAllClear, gUserColorDictOEM } from '../../userColors.js';
import { convertRGB_to_HEX, invertColor, padZero, queryNamedNotesSetBGOpacity, scrollToTop, toInt } from '../../utils.js';
import { setupSongTests, getSong, getCurrentSection, getSectionsCurrentIndex, getSections } from '../../infinite-neck.js';


// Export for ES module consumers (optional)
export default {
  setupSongTests,
  makeSong,
  getSong,
  getCurrentSection,
  getSectionsCurrentIndex,
  getSections,
};
