// _tests/jest/jest-setup.js
// Loads all JS dependencies in browser order for Jest tests
const fs = require('fs');
const vm = require('vm');
const path = require('path');

// List of JS files in the order from index.html
const jsFiles = [
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
  'infinite-neck.js',
];

// Create a context for the scripts to run in (simulates window/global)
const context = global;

// Load each JS file into the context
jsFiles.forEach(file => {
  const filePath = path.join(__dirname, '../../', file);
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInThisContext(code, { filename: file });
});

// Now setupSongTests should be available globally
if (typeof setupSongTests === 'function') {
  setupSongTests();
}

// Export globals if needed (optional)
module.exports = {
  setupSongTests: typeof setupSongTests === 'function' ? setupSongTests : undefined,
  makeSong: typeof makeSong === 'function' ? makeSong : undefined,
};
