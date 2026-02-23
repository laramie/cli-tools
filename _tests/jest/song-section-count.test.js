require('./jest-setup.js');
const fs = require('fs');
const path = require('path');

// Map song filenames to expected section counts
const songTests = [
  { file: 'All-Chords-A.json', expectedSections: 12 },
  // Add more song files and expected counts as needed
];

describe('Song JSON section count', () => {
  songTests.forEach(({ file, expectedSections }) => {
    test(`${file} loads with ${expectedSections} sections`, () => {
      const filePath = path.join(__dirname, '../../songs', file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // makeSong should now be available globally
      const gSong = global.makeSong();
      gSong.addSections(data);
      expect(gSong.getSections().length).toBe(expectedSections);
    });
  });
});
