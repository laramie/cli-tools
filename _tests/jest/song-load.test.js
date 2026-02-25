require('./jest-setup.js');
const fs = require('fs');
const path = require('path');

const LF = "\n";

const INFINITE_NECK_SONGLIST = process.env.INFINITE_NECK_SONGLIST;

// Toggle verbose/terse output with bash environment variable INFINITE_NECK_VERBOSE
// See printVerboseModeMessage() for explanation.
const INFINITE_NECK_VERBOSE = process.env.INFINITE_NECK_VERBOSE;
const VERBOSE_MODE_INT = parseInt(INFINITE_NECK_VERBOSE, 10);
const VERBOSE_MODE = isNaN(VERBOSE_MODE_INT) 
         ? 0
         : VERBOSE_MODE_INT;

const MORE_THRESHOLD = VERBOSE_MODE > 1
                       ? 100
                       : 10;

function logVerbose(level, msg) {
  if (VERBOSE_MODE === -1) return;
  if (VERBOSE_MODE >= level) console.log(msg);
}

function printVerboseModeMessage(){
    function getHelpMsg(){
      return   '\r\n    INFINITE_NECK_VERBOSE values:'
              +'\r\n    -1 : Ultra-terse, no console logs at all'
              +'\r\n     0 : Terse, only minimal Jest output'
              +'\r\n     1 : Verbose, summary info, flat context objects, <10 rootIDs'
              +'\r\n     2 : More-verbose, pretty context objects'
              +'\r\n     3 : Ultra-verbose, pretty Section objects, per-loop logs, <100 rootIDs';
    }
    function getSnarky(){
      return '\r\n   In bash this sets verbose value of 1:'
              +'\r\n'
              +'\r\n          export INFINITE_NECK_VERBOSE=1'
              +'\r\n';
    }
    if (VERBOSE_MODE>0) {
      logVerbose(0, 'Verbose mode because you ran with INFINITE_NECK_VERBOSE='+VERBOSE_MODE
                    +getHelpMsg()
      );
    } else if (VERBOSE_MODE === -1){
      //Nothing.  Stock Jest test. No messages, not even this one.
    } else if (isNaN(VERBOSE_MODE_INT)) {
      logVerbose(0, 'Verbose mode because you ran with INFINITE_NECK_VERBOSE='+INFINITE_NECK_VERBOSE
                  +'\r\n   which is not a valid level. Run with -1 to suppress this message, or with 1, 2, or 3 (verbose modes) to show full summaries and help.'
                  +getSnarky()
                  +getHelpMsg()
      );
    } else {
      logVerbose(0, 'Terse mode because env var was not set, or set to 0 with: export INFINITE_NECK_VERBOSE=0'
                  +'\r\n   Run with -1 to suppress this message, or with 1, 2, or 3 (verbose modes) to show full summaries and help.'
                  +getSnarky()
                  +getHelpMsg()
      );
    }  
}

// --- Song Section Structure and Summary Test ---
const ALLOWED_NOTE_NAMES = ["A","Bb","B","C","Db","D","Eb","E","F","Gb","G","Ab"];

const SONGS_DIR = path.join(__dirname, '../../songs');
  

// Song list file constants
const SONGSDIR = 'songs/';
const SONGSTEST_RELDIR = 'tests/';
const SONGSTESTDIR = SONGSDIR+SONGSTEST_RELDIR;

const SONG_LIST_FILE = SONGSDIR+'song-list.json';
const TEST_SONG_LIST_FILE = SONGSTESTDIR+'test-song-list.json';
const FAILURE_TEST_SONG_LIST_FILE = SONGSTESTDIR+'failure-test-song-list.json';
const FAILURE_STRICT_TEST_SONG_LIST_FILE = SONGSTESTDIR+'failure-strict-test-song-list.json';

function createSongList(theSongListFile, relDir=null){
    const songListPath = path.join(__dirname, '../../', theSongListFile);
    let theSongList = JSON.parse(fs.readFileSync(songListPath, 'utf8')).songs;
    if (relDir){
      theSongList = theSongList.map(f => `${relDir}${f}`);
    }
    return theSongList;
}

function createSongFilesArray(){
    // Dynamically load all song files from song-list.json
    const songList = createSongList(SONG_LIST_FILE);

    // Load extra test songs 
    const testSongList = createSongList(TEST_SONG_LIST_FILE, SONGSTEST_RELDIR);

    // Load failure test songs
    const failureTestSongList = createSongList(FAILURE_TEST_SONG_LIST_FILE, SONGSTEST_RELDIR);

    // Load failure test strict-mode songs
    const failureStrictTestSongList = createSongList(FAILURE_STRICT_TEST_SONG_LIST_FILE, SONGSTEST_RELDIR);

    // Combine all files and mark expected failures

    let theSongFiles = [
        ...songList.map(f => ({
          file: f,
          songTestOptions: {expectedFailure: false, strictFile_styleNum: true, list: SONG_LIST_FILE, dir: SONGSDIR, reason: "library-songs👍pass"},
          toString: function() {
            return "song:" + f.toString() + JSON.stringify(this.songTestOptions);
          }
        })),
        ...testSongList.map(f => ({
          file: f,
          songTestOptions: { expectedFailure: false, list: TEST_SONG_LIST_FILE, dir: SONGSTESTDIR, reason: "test-songs👍pass"},
          toString: function() {
            return "song:" + f.toString() + JSON.stringify(this.songTestOptions);
          }
        })),
        ...failureTestSongList.map(f => ({
          file: f,
          songTestOptions: { expectedFailure: true, strictFile_styleNum: true, list: FAILURE_TEST_SONG_LIST_FILE, dir: SONGSTESTDIR, reason: "test-songs👍fail"},
          toString: function() {
            return "song:" + f.toString() + JSON.stringify(this.songTestOptions);
          }
        })),
        ...failureStrictTestSongList.map(f => ({
          file: f,
          songTestOptions: { expectedFailure: true, strictFile_styleNum: true, list: FAILURE_STRICT_TEST_SONG_LIST_FILE, dir: SONGSTESTDIR, reason: "test-songs👍fail-strict"},
          toString: function() {
            return "song:" + f.toString() + JSON.stringify(this.songTestOptions);
          }
        }))
    ];
    return theSongFiles;
  }

  function createSongFilesArrayFromNamed(named){

  }

let songFiles = INFINITE_NECK_SONGLIST
                ? createSongFilesArrayFromNamed(INFINITE_NECK_SONGLIST)
                : createSongFilesArray();  

// Filter to a single song if INFINITE_NECK_SONG is set
const INFINITE_NECK_SONG = process.env.INFINITE_NECK_SONG;
if (INFINITE_NECK_SONG) {
  songFiles = songFiles.filter(entry => entry.file === INFINITE_NECK_SONG);
}


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

function validateNamedNotes(namedNotes, songTestOptions = {}, summaryInfo) {
  for (const key of Object.keys(namedNotes)) {
    summaryInfo.namedNoteKey = key;
    expect(ALLOWED_NOTE_NAMES).toContain(key);
    const note = namedNotes[key];
    if (Object.keys(note).length === 0) {  // allow empty note entries like "G":{}
      continue;
    }
    summaryInfo.note = VERBOSE_MODE > 1 
        ? note 
        : JSON.stringify(note);
    expect(note).toHaveProperty('noteName');
    expect(note).toHaveProperty('colorClass');
    validateStyleNum(note, songTestOptions);
    expect(note.noteName).toBe(key);
    expect(typeof note.colorClass === 'string' && note.colorClass.length > 0).toBe(true);
  }
  summaryInfo.note = "";
  summaryInfo.namedNoteKey = "";
}

function validateNoteTables(noteTables, songTestOptions = {}, summaryInfo) {
  expect(typeof noteTables).toBe('object');
  for (const tblnameKey of Object.keys(noteTables)) {
    summaryInfo.tableName = tblnameKey;
    const oneTable = noteTables[tblnameKey];
    if (!Array.isArray(oneTable)) continue;  //change this to expect an Array.
    oneTable.forEach((note, idx) => {
      summaryInfo.noteTableIndex = idx;
      summaryInfo.note = VERBOSE_MODE > 1 
        ? note 
        : JSON.stringify(note);
      expect(note).toHaveProperty('noteName');
      expect(note).toHaveProperty('colorClass');
      validateStyleNum(note, songTestOptions);
      expect(typeof note.colorClass === 'string' && note.colorClass.length > 0).toBe(true);
    });
    summaryInfo.noteTableIndex = "";
    summaryInfo.note = "";
  }
  summaryInfo.tableName = "";
}

// Helper to validate styleNum property according to strictFile_styleNum
function validateStyleNum(obj, songTestOptions = {}) {
  if (songTestOptions.strictFile_styleNum) {
    expect(obj).toHaveProperty('styleNum');
    expect(typeof obj.styleNum === 'number' && Number.isInteger(obj.styleNum)).toBe(true);
  } else {
    if (obj.hasOwnProperty('styleNum')) {
      expect(typeof obj.styleNum === 'number' && Number.isInteger(obj.styleNum)).toBe(true);
    }
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
function runSongValidation(file, data, songTestOptions = {}) {
  const expectedSections = Array.isArray(data.sections) ? data.sections.length : 0;
  const sectionRootIDsArr = getSectionRootIDs(data);
  const sectionRootIDsArrStr = rootIDsMore(sectionRootIDsArr);
  const sectionRootIDs = VERBOSE_MODE > 0
    ? `${sectionRootIDsArrStr}`
    : `${sectionRootIDsArr.length}`;
  let failed = false;
  let errorSummary = '';
  let summaryInfo = { expectedSections, sectionRootIDs, song_rootID: data.rootID };
  let currentSectionIndex = -1;
  let currentObjectDump = "";
  try {
    logVerbose(1, '🡆  In song ⠶ '+file
                   +LF+" expectedFailure:"+songTestOptions.expectedFailure
                  +LF+"     "+JSON.stringify({expectedSections, sectionRootIDs, song_rootID: data.rootID})
                  +LF+" songTestOptions:"+JSON.stringify(songTestOptions));
    const gSong = global.makeSong();
    gSong.addSections(data);
    expect(gSong.getSections().length).toBe(expectedSections);
    expect(data).toHaveProperty('rootID');  // Song-level rootID assertion
    // Section-level rootID assertions (already checked in getSectionRootIDs)
    validateSectionDictionaries(data, file); // Section-level namedNotes and noteTables assertions
    if (Array.isArray(data.sections)) {
      data.sections.forEach((section, i) => {
        currentSectionIndex = i;
        summaryInfo.currentSectionIndex = i;
        currentObjectDump = JSON.stringify(section, null, 4);
        expect(section).toHaveProperty('noteTables');
        expect(section).toHaveProperty('namedNotes');
        validateNoteTables(section.noteTables, songTestOptions, summaryInfo);
        validateNamedNotes(section.namedNotes, songTestOptions, summaryInfo);
        const noteTableSummary = getNoteTableSummary(section.noteTables);
        const namedNotesCount = getNamedNotesCount(section.namedNotes);
        logVerbose(3, `sections[${i}]➝  noteTables${noteTableSummary}  •  namedNotes:${namedNotesCount}  •  《${sectionRootIDs}》 `);
      });
    }
    logVerbose(1, '👉   leaving test block ⠶ '+file
       +LF+" expectedFailure:"+songTestOptions.expectedFailure
                  +LF+" songTestOptions:"+JSON.stringify(songTestOptions));
    // --- End Structure and Summary Validation ---
  } catch (e) {
    logVerbose(1, '👉   caught exception ⠶ '+file
                  +LF+" expectedFailure:"+songTestOptions.expectedFailure
                  +LF+" songTestOptions:"+JSON.stringify(songTestOptions));
    failed = true;
    // Always log filename and summary info with exception
    const summaryStr = VERBOSE_MODE > 1
            ? JSON.stringify(summaryInfo, null, 4) 
            : JSON.stringify(summaryInfo);
    const jestException = VERBOSE_MODE > 1
            ? `${e.message}\n${e.stack}`
            : `${e.message}\n`;
    errorMsg = 
      `\n🛑 Failure in file: ${file} :: sections[${currentSectionIndex}]\nSummary: ${summaryStr}`
                +LF+" expectedFailure:"+songTestOptions.expectedFailure
                 +LF+`failed: ${failed}`
                +`\n✴   Jest Exception: \n❮❮❮\n ${jestException}\n❯❯❯\n\n`;
    if (VERBOSE_MODE>0) {
      errorSummary = errorMsg;
      let dump = "";
      if (VERBOSE_MODE>2){
        dump = LF+LF+"currentObject:"+LF+currentObjectDump;
      }
      logVerbose(1, errorMsg + dump);
    } else {
      errorSummary = '';
    }
  }
  logVerbose(1, '🎄   preparing to run final expect ⠶ '+file
                  +LF+" expectedFailure:"+songTestOptions.expectedFailure
                  +LF+`failed: ${failed}`
                  +LF+" songTestOptions:"+JSON.stringify(songTestOptions));

  
  if (songTestOptions.expectedFailure) {
    expect(failed).toBe(true);
  } else {
    expect(failed).toBe(false);
  }
  return { expectedSections, sectionRootIDs, song_rootID: data.rootID, errorSummary };
}


function rootIDsMore(sectionRootIDsArr){
  const sectionRootIDsArrStr = sectionRootIDsArr.length < MORE_THRESHOLD
    ? `[${sectionRootIDsArr.join(",")}]`
    : `[${sectionRootIDsArr.slice(0, MORE_THRESHOLD).join(",")}...${sectionRootIDsArr.length - MORE_THRESHOLD} more]`;
  return sectionRootIDsArrStr;
}

//===================================================================
//========         Now run the tests           ======================
//===================================================================

describe('Song file and gSong loading validation', () => {
  printVerboseModeMessage();
  let accumFilename = [];
  let data = null;
  songFiles.forEach(({ file, songTestOptions }) => {
    const filePath = path.join(__dirname, '../../songs', file);
    accumFilename.push(`${filePath}`);
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e){
      logVerbose(1, `File list so far: ${LF}${accumFilename.join(LF)}`)
      logVerbose(1, `🛑 Error reading file: ${filePath}`);
      throw e;
    }
    // Gather summary info for label
    const sectionCount = Array.isArray(data.sections) ? data.sections.length : 0;
    const rootIDs = Array.isArray(data.sections) ? rootIDsMore(data.sections.map(s => s.rootID)) : '';
    const strictMode = songTestOptions.strictFile_styleNum ? '| fmt:strict🧐' : '';
    const rootIDsLabel = (VERBOSE_MODE>0) ? `${rootIDs}` : '';
    const testLabel = `${SONGSDIR}${file}`     // file is like "bar.json" and "tests/foo.json" :: tests/ is already included in the test file because of how they were parsed at the top of this test file.
      + ` | list:${songTestOptions.list}`
      + ` | sections:${sectionCount}${rootIDsLabel}`
      + ` ${strictMode}`
      + (songTestOptions.expectedFailure ? ' (expected failure🍌)' : '')
      + ` | reason:${songTestOptions.reason}`;
    test(testLabel, () => {
      runSongValidation(file, data, songTestOptions);
    });
  });
});

