// _tests/jest/jest-setup.js
// Loads all JS dependencies in browser order for Jest tests

// Import any ES modules directly (if needed)
// import { gColorPickerColors } from '../../colorPickerColors.js'; // Only if you need it directly

import fs from 'fs';
import vm from 'vm';
import path from 'path';

// List of JS files in the order from index.html
const jsFiles = [
  'jsonpath-0.8.0.js',
  'utils.js',
  'drag.js',
  'song.js',
  'graveyard.js',
  'themes.js',
  'themeFunctions.js',
  'key-handlers.js',
  'notetable.js',
  'command-line.js',
  'section-recorder.js',
  'looper.js',
  'note.js',
  'tunings.js',
  'table-builder.js',
  'colorFunctions.js',
  'colorPickerColors.js',
  'userColors.js',
  'display-options.js',
  'svgLines.js',
  'menu.js',
  'event-bus.js',
  'infinite-neck.js'
];

// Create a context where the scripts to run (simulates window/global)
const context = vm.createContext(global);

// Load each JS file into the context
jsFiles.forEach(file => {
  const filePath = path.join(__dirname, '../../', file);
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(code, context, { filename: file });
});

// Attach important globals for test access
global.gAutocolors = context.gAutocolors;
global.gColorPickerColors = context.gColorPickerColors;
global.gMenuFile = context.gMenuFile;
global.gThemes = context.gThemes;
global.allTunings = context.allTunings;
global.gUserColorDict = context.gUserColorDict;
global.gUserColorDictRolesDefault = context.gUserColorDictRolesDefault;
global.gUserColorDictFingeringsDefault = context.gUserColorDictFingeringsDefault;
global.gDefault_CycleOfColors = context.gDefault_CycleOfColors;
global.gAllClear = context.gAllClear;

// Now setupSongTests should be available globally
if (typeof context.setupSongTests === 'function') {
  global.setupSongTests = context.setupSongTests;
  context.setupSongTests();
}

if (typeof context.makeSong === 'function') {
  global.makeSong = context.makeSong;
}

// Export globals if needed (optional)
export default {
  setupSongTests: typeof context.setupSongTests === 'function' ? context.setupSongTests : undefined,
  makeSong: typeof context.makeSong === 'function' ? context.makeSong : undefined,
};