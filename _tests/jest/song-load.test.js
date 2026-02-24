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

const failureStrictTestSongListPath = path.join(__dirname, '../../songs/tests/failure-strict-test-song-list.json');
const failureStrictTestSongList = JSON.parse(fs.readFileSync(failureStrictTestSongListPath, 'utf8')).songs.map(f => `tests/${f}`);

// Filter out song-list.json itself to avoid recursion, then add extra test songs
const filteredSongList = songList.filter(f => f !== 'song-list.json').concat(testSongList);

// Combine all files and mark expected failures

const songFiles = [
    ...filteredSongList.map(f => ({
      file: f,
      expectedFailure: false,
      songTestOptions: {},
      toString: function() {
        var ef = this.expectedFailure ? " [failure expected]" : "";
        return "song:" + f.toString() + ef;
      }
    })),
    ...failureTestSongList.map(f => ({
      file: f,
      expectedFailure: true,
      songTestOptions: {},
      toString: function() {
        var ef = this.expectedFailure ? " [failure expected]" : "";
        return "song:" + f.toString() + ef;
      }
    })),
    ...failureStrictTestSongList.map(f => ({
      file: f,
      expectedFailure: true,
      songTestOptions: { strictFile_styleNum: true },
      toString: function() {
        var ef = this.expectedFailure ? " [failure expected]" : "";
        return "song:" + f.toString() + ef + " [strictFile_styleNum]";
      }
    }))
];


//==================================================================
//=========== Helper Functions =====================================
//==================================================================


function getNoteTableSummary(noteTables) {
  if (!noteTables) return 'null';
  if (typeof noteTables !== 'object') return 'not-an-object';
  const keys = Object.keys(noteTables);
  if (keys.length === 0) return ':0';
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


function validateNamedNotes(namedNotes, songTestOptions = {}) {
  for (const key of Object.keys(namedNotes)) {
    expect(ALLOWED_NOTE_NAMES).toContain(key);
    const nn = namedNotes[key];
    expect(nn).toHaveProperty('noteName');
    expect(nn).toHaveProperty('colorClass');
    if (songTestOptions.strictFile_styleNum) {
      expect(nn).not.toHaveProperty('styleNum');
    } else {
      expect(nn).toHaveProperty('styleNum');
      expect(typeof nn.styleNum === 'number' && Number.isInteger(nn.styleNum)).toBe(true);
    }
    expect(nn.noteName).toBe(key);
    expect(typeof nn.colorClass === 'string' && nn.colorClass.length > 0).toBe(true);
  }
}

function validateNoteTables(noteTables, songTestOptions = {}) {
  expect(typeof noteTables).toBe('object');
  for (const key of Object.keys(noteTables)) {
    expect(ALLOWED_NOTE_NAMES).toContain(key);
    const nn = namedNotes[key];
    // If nn is an empty object, allow it, e.g. 
    if (Object.keys(nn).length === 0) {
      continue;
    }
    // Otherwise, run expects
    expect(nn).toHaveProperty('noteName');
    expect(nn).toHaveProperty('colorClass');
    if (songTestOptions.strictFile_styleNum) {
      // In strict mode, styleNum must be present and an integer
      expect(nn).toHaveProperty('styleNum');
      expect(typeof nn.styleNum === 'number' && Number.isInteger(nn.styleNum)).toBe(true);
    } else {
      // In normal mode, styleNum is optional, but if present, must be an integer
      if (nn.hasOwnProperty('styleNum')) {
        expect(typeof nn.styleNum === 'number' && Number.isInteger(nn.styleNum)).toBe(true);
      }
    }
    expect(nn.noteName).toBe(key);
    expect(typeof nn.colorClass === 'string' && nn.colorClass.length > 0).toBe(true);
  }
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


// Helper to run all validations for a song file
function runSongValidation(file, data, expectedFailure, songTestOptions = {}) {
  const expectedSections = Array.isArray(data.sections) ? data.sections.length : 0;
  const sectionRootIDs = getSectionRootIDs(data);
  const sectionRootIDsStr = `[${sectionRootIDs.join(",")}]`;
  const sectionRootIDsSummary = VERBOSE_MODE
    ? `section.rootIDs: ${sectionRootIDsStr}`
    : `section.rootIDs: ${sectionRootIDs.length}`;
  let failed = false;
  let errorSummary = '';
  let summaryInfo = { expectedSections, sectionRootIDsSummary, rootID: data.rootID };
  let currentIndex = -1;
  let currentObjectDump = "";
  try {
    if (VERBOSE_MODE) {console.log('🡆  In song ⠶ '+file);}
    const gSong = global.makeSong();
    gSong.addSections(data);
    expect(gSong.getSections().length).toBe(expectedSections);
    // Song-level rootID assertion
    expect(data).toHaveProperty('rootID');
    // Section-level rootID assertions (already checked in getSectionRootIDs)
    // Section-level namedNotes and noteTables assertions
    validateSectionDictionaries(data, file);

    // --- Structure and Summary Validation (moved from second describe) ---
    if (Array.isArray(data.sections)) {
      data.sections.forEach((section, i) => {
        currentIndex = i;
        currentObjectDump = JSON.stringify(section, null, 4);
        expect(section).toHaveProperty('noteTables');
        expect(section).toHaveProperty('namedNotes');
        validateNoteTables(section.noteTables, songTestOptions);
        validateNamedNotes(section.namedNotes, songTestOptions);
        const noteTableSummary = getNoteTableSummary(section.noteTables);
        const namedNotesCount = getNamedNotesCount(section.namedNotes);
        if (VERBOSE_MODE) {
          console.log(`sections[${i}]➝  noteTables${noteTableSummary}  •  namedNotes:${namedNotesCount}  •  《${sectionRootIDsSummary}》 `);
        }
      });
    }

    // --- End Structure and Summary Validation ---
  } catch (e) {
    failed = true;
    // Always log filename and summary info with exception
    const summaryStr = JSON.stringify(summaryInfo);
    errorMsg = `\n--- Failure in file: ${file} :: sections[${currentIndex}] ---\nSummary: ${summaryStr}\n${e.message}\n${e.stack}`;
    if (VERBOSE_MODE || expectedFailure) {
      errorSummary = errorMsg;
      errorMsg = errorMsg;
      if (VERBOSE_MODE){
        console.log(errorMsg +"\r\n\r\ncurrentObject:\r\n    "+currentObjectDump);
      }
    } else {
      errorSummary = '';
    }
  }
  if (VERBOSE_MODE) {
    console.log("runSongValidation: song: "+file
             +"\r\n     "+JSON.stringify({expectedSections, sectionRootIDsSummary, rootID: data.rootID}));
  }
  if (expectedFailure) {
    expect(failed).toBe(true);
  } else {
    expect(failed).toBe(false);
  }
  return { expectedSections, sectionRootIDsSummary, rootID: data.rootID, errorSummary };
}

function printVerboseModeMessage(){
    if (VERBOSE_MODE) {
      console.log('Verbose mode because INFINITE_NECK_VERBOSE=1'
                  +'\r\n   Summaries will be longer.'
                  +'\r\n   Per loop console.log may be issued.'
                  +'\r\n   Run in terse mode to show less.'
      );
    } else  {
      console.log('Terse mode because INFINITE_NECK_VERBOSE=0'
                  +'\r\n   Summaries will be shorter.  Run in verbose mode to show full summaries.'
      );
    }  
}


//===================================================================
//========         Now run the tests           ======================
//===================================================================


describe('Song file and gSong loading validation', () => {
  printVerboseModeMessage();
  songFiles.forEach(({ file, expectedFailure, songTestOptions }) => {
    const filePath = path.join(__dirname, '../../songs', file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Gather summary info for label
    const sectionCount = Array.isArray(data.sections) ? data.sections.length : 0;
    const rootIDs = Array.isArray(data.sections) ? data.sections.map(s => s.rootID).join(',') : '';
    const strictMode = songTestOptions.strictFile_styleNum ? 'strict' : 'normal';
    const testLabel = `${file}`
      + (expectedFailure ? ' (expected failure)' : '')
      + ` | sections:${sectionCount}`
      + ` | rootIDs:[${rootIDs}]`
      + ` | songFormat:${strictMode}`;
    test(testLabel, () => {
      runSongValidation(file, data, expectedFailure, songTestOptions);
    });
  });
});

