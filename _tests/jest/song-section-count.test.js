require('./jest-setup.js');
const fs = require('fs');
const path = require('path');

// Toggle verbose/terse output with bash environment variable INFINITE_NECK_VERBOSE
const VERBOSE_MODE = process.env.INFINITE_NECK_VERBOSE === '1' || process.env.INFINITE_NECK_VERBOSE === 'true';

// --- Song Section Structure and Summary Test ---
const ALLOWED_NOTE_NAMES = ["A","Bb","B","C","Db","D","Eb","E","F","Gb","G","Ab"];


const SONGS_DIR = path.join(__dirname, '../../songs');
  
// Dynamically load all song files from song-list.json
const songListPath = path.join(__dirname, '../../songs/song-list.json');
const songList = JSON.parse(fs.readFileSync(songListPath, 'utf8')).songs;

// Load extra test songs from songs/tests/test-song-list.json
const testSongListPath = path.join(__dirname, '../../songs/tests/test-song-list.json');
const testSongList = JSON.parse(fs.readFileSync(testSongListPath, 'utf8')).songs.map(f => `tests/${f}`);

// Load failure test songs from songs/tests/failure-test-song-list.json
const failureTestSongListPath = path.join(__dirname, '../../songs/tests/failure-test-song-list.json');
const failureTestSongList = JSON.parse(fs.readFileSync(failureTestSongListPath, 'utf8')).songs.map(f => `tests/${f}`);

// Filter out song-list.json itself to avoid recursion, then add extra test songs
const filteredSongList = songList.filter(f => f !== 'song-list.json').concat(testSongList);

// Combine all files and mark expected failures
const songFiles = [
    ...filteredSongList.map(f => ({ file: f, expectedFailure: false })),
    ...failureTestSongList.map(f => ({ file: f, expectedFailure: true }))
];



function getNoteTableSummary(noteTables) {
  if (!noteTables || typeof noteTables !== 'object') return '';
  const keys = Object.keys(noteTables);
  if (keys.length === 0) return '';
  return (
    '[' +
    keys
      .map(key => `${key}:${Array.isArray(noteTables[key]) ? noteTables[key].length : 0}`)
      .join(',') +
    ']'
  );
}

function getNamedNotesCount(namedNotes) {
  if (!namedNotes || typeof namedNotes !== 'object') return 0;
  return Object.keys(namedNotes).length;
}

function validateNamedNotes(namedNotes, sectionIdx) {
  for (const key of Object.keys(namedNotes)) {
    expect(ALLOWED_NOTE_NAMES).toContain(key);
    const nn = namedNotes[key];
    expect(nn).toHaveProperty('noteName');
    expect(nn).toHaveProperty('colorClass');
    expect(nn).toHaveProperty('styleNum');
    expect(nn.noteName).toBe(key);
    expect(typeof nn.styleNum === 'number' && Number.isInteger(nn.styleNum)).toBe(true);
    expect(typeof nn.colorClass === 'string' && nn.colorClass.length > 0).toBe(true);
  }
}

function validateNoteTables(noteTables, sectionIdx) {
  expect(typeof noteTables).toBe('object');
  for (const key of Object.keys(noteTables)) {
    const arr = noteTables[key];
    expect(Array.isArray(arr)).toBe(true);
    for (const obj of arr) {
      expect(obj).toHaveProperty('midinum');
      expect(obj).toHaveProperty('row');
      expect(obj).toHaveProperty('col');
      expect(obj).toHaveProperty('colorClass');
      expect(obj).toHaveProperty('styleNum');
      expect(obj).toHaveProperty('noteName');
    }
  }
}


// Helper to run all validations for a song file
function runSongValidation(file, data, expectedFailure) {
  const expectedSections = Array.isArray(data.sections) ? data.sections.length : 0;
  expect(data).toHaveProperty('rootID');
  const sectionRootIDs = getSectionRootIDs(data);
  const sectionRootIDsStr = `[${sectionRootIDs.join(",")}]`;
  const sectionRootIDsSummary = VERBOSE_MODE
    ? `section rootIDs: ${sectionRootIDsStr}`
    : `section rootIDs: ${sectionRootIDs.length}`;
  let failed = false;
  let errorSummary = '';
  try {
    const gSong = global.makeSong();
    gSong.addSections(data);
    expect(gSong.getSections().length).toBe(expectedSections);
    // Song-level rootID assertion
    expect(data).toHaveProperty('rootID');
    // Section-level rootID assertions (already checked in getSectionRootIDs)
    // Section-level namedNotes and noteTables assertions
    validateSectionDictionaries(data, file);
  } catch (e) {
    failed = true;
    if (expectedFailure) {
      if (VERBOSE_MODE) {
        errorSummary = `\n--- Failure Summary ---\n${e.message}\n${e.stack}`;
        console.log(`${file} failure summary:${errorSummary}`);
      } else {
        errorSummary = '';//terse mode. expected errors are only identified by the thing that is wrong by the filename convention, e.g. empty-song-missing-namedNotes.json"
      }
    }
  }
  if (expectedFailure) {
    expect(failed).toBe(true);
  } else {
    expect(failed).toBe(false);
  }
  return { expectedSections, sectionRootIDsSummary, rootID: data.rootID, errorSummary };
}
// Helper to validate namedNotes and noteTables presence as objects in each section
function validateSectionDictionaries(data) {
  if (!Array.isArray(data.sections)) return;
  data.sections.forEach((section, idx) => {
    expect(section).toHaveProperty('namedNotes');
    expect(typeof section.namedNotes).toBe('object');
    expect(section).toHaveProperty('noteTables');
    expect(typeof section.noteTables).toBe('object');
  });
}
// Helper to validate rootID presence at song and section level
function getSectionRootIDs(data) {
  if (!Array.isArray(data.sections)) return [];
  return data.sections.map(section => {
    expect(section).toHaveProperty('rootID');
    return section.rootID;
  });
}

describe('Song JSON section count', () => {
  songFiles.forEach(({ file, expectedFailure }) => {
    const filePath = path.join(__dirname, '../../songs', file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const { expectedSections, sectionRootIDsSummary, rootID, errorSummary } = runSongValidation(file, data, expectedFailure);
    const testLabel = expectedFailure
      ? `${file} (expected failure)`
      : `${file} ${expectedSections} sections, rootID: ${rootID}, ${sectionRootIDsSummary}`;
    test(testLabel, () => {
      runSongValidation(file, data, expectedFailure);
    });
  });
});

describe('Song Section Structure and Summary', () => {
  for (const songFile of songFiles) {
    test(`sections summary for ${songFile}`, () => {
      const songPath = path.join(SONGS_DIR, songFile);
      const song = JSON.parse(fs.readFileSync(songPath, 'utf8'));
      expect(song).toHaveProperty('sections');
      expect(Array.isArray(song.sections)).toBe(true);
      song.sections.forEach((section, i) => {
        expect(section).toHaveProperty('noteTables');
        expect(section).toHaveProperty('namedNotes');
        validateNoteTables(section.noteTables, i);
        validateNamedNotes(section.namedNotes, i);
        const noteTableSummary = getNoteTableSummary(section.noteTables);
        const namedNotesCount = getNamedNotesCount(section.namedNotes);
        if (VERBOSE_MODE) {
          console.log(`sections[${i}],noteTables${noteTableSummary},namedNotes:${namedNotesCount}`);
        }
      });
    });
  }
});
