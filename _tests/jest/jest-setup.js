// _tests/jest/jest-setup.js
// Loads all JS dependencies in browser order for Jest tests

import { gColorPickerColors } from '../../colorPickerColors.js';


const fs = require('fs');
const vm = require('vm');
const path = require('path');

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
global.gAutocolors = typeof gAutocolors !== 'undefined' ? gAutocolors : undefined;
global.gColorPickerColors = typeof gColorPickerColors !== 'undefined' ? gColorPickerColors : undefined;
global.gMenuFile = typeof gMenuFile !== 'undefined' ? gMenuFile : undefined;
global.gThemes = typeof gThemes !== 'undefined' ? gThemes : undefined;
global.allTunings = typeof allTunings !== 'undefined' ? allTunings : undefined;
global.gUserColorDict = typeof gUserColorDict !== 'undefined' ? gUserColorDict : undefined;
global.gUserColorDictRolesDefault = typeof gUserColorDictRolesDefault !== 'undefined' ? gUserColorDictRolesDefault : undefined;
global.gUserColorDictFingeringsDefault = typeof gUserColorDictFingeringsDefault !== 'undefined' ? gUserColorDictFingeringsDefault : undefined;
global.gDefault_CycleOfColors = typeof gDefault_CycleOfColors !== 'undefined' ? gDefault_CycleOfColors : undefined;
global.gAllClear = typeof gAllClear !== 'undefined' ? gAllClear : undefined;

// Now setupSongTests should be available globally
if (typeof setupSongTests === 'function') {
  global.setupSongTests = setupSongTests;
  setupSongTests();
}

if (typeof makeSong === 'function') {
  global.makeSong = makeSong;
}

// Export globals if needed (optional)
module.exports = {
  setupSongTests: typeof setupSongTests === 'function' ? setupSongTests : undefined,
  makeSong: typeof makeSong === 'function' ? makeSong : undefined,
};
