require('./jest-setup.js');
const fs = require('fs');
const path = require('path');

const LF = "\n";
const LFWS = "\n    ";
const LFWS2 = "\n        ";

const INFINITE_NECK_SONG = process.env.INFINITE_NECK_SONG || "";

const INFINITE_NECK_SONGLIST = process.env.INFINITE_NECK_SONGLIST || "";

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
      return   LF+LFWS+'INFINITE_NECK_VERBOSE values:'
              +LFWS2+'-1 : Ultra-terse: no console logs at all'
              +LFWS2+' 0 : Terse: only minimal Jest output'
              +LFWS2+' 1 : Verbose: summary info, flat context objects, <10 rootIDs, show Help'
              +LFWS2+' 2 : More-verbose: pretty context objects, songList dump'
              +LFWS2+' 3 : Ultra-verbose: pretty Section objects, per-loop logs, <100 rootIDs, debug info';
    }
    function getSnarky(){
      return   LF+LFWS+'In bash this sets Verbose value of 1:'
              +LF
              +LFWS+'    export INFINITE_NECK_VERBOSE=1'
              +LF;
    }
    function showEnvVarOptions(){
      return  LF+LF+'🛈  ENV vars passed in: '
        +LFWS2+'INFINITE_NECK_SONG='+INFINITE_NECK_SONG
        +LFWS2+'INFINITE_NECK_SONGLIST='+INFINITE_NECK_SONGLIST
        +LFWS2+'INFINITE_NECK_VERBOSE='+INFINITE_NECK_VERBOSE
        +LFWS2+'INFINITE_NECK_VERBOSE(calculated)='+VERBOSE_MODE;
    }
    if (VERBOSE_MODE>0) {
      logVerbose(0, '🛈  Verbose mode because INFINITE_NECK_VERBOSE='+VERBOSE_MODE
                    +getHelpMsg()
                    +showEnvVarOptions()
      );
    } else if (VERBOSE_MODE === -1){
      //Nothing.  Stock Jest test. No messages, not even this one.
    } else if (isNaN(VERBOSE_MODE_INT)) {
      logVerbose(0, '🛈  Terse mode because INFINITE_NECK_VERBOSE='+INFINITE_NECK_VERBOSE
                  +'\r\n   Run with -1 to suppress this message, or 1 to show Help.'
                  +getHelpMsg()
                  +getSnarky()
                  +showEnvVarOptions()
      );
    } else {  //they explicitly set to 0
      logVerbose(0, '🛈  Terse mode because INFINITE_NECK_VERBOSE='+INFINITE_NECK_VERBOSE
                  +'\r\n   Run with -1 to suppress this message, or 1 to show Help'
                  +showEnvVarOptions()
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
    const songList = createSongList(SONG_LIST_FILE);
    const testSongList = createSongList(TEST_SONG_LIST_FILE, SONGSTEST_RELDIR);
    const failureTestSongList = createSongList(FAILURE_TEST_SONG_LIST_FILE, SONGSTEST_RELDIR);
    const failureStrictTestSongList = createSongList(FAILURE_STRICT_TEST_SONG_LIST_FILE, SONGSTEST_RELDIR);

    // Combine all files and mark expected failures

    let theSongFilesArray = [
        ...songList.map(f => ({
          file: f,
          songTestOptions: {expectedFailure: false, strictFile_styleNum: true, list: SONG_LIST_FILE, dir: SONGSDIR, reason: "library-songs👍pass"}
          
        })),
        ...testSongList.map(f => ({
          file: f,
          songTestOptions: { expectedFailure: false, list: TEST_SONG_LIST_FILE, dir: SONGSTESTDIR, reason: "test-songs👍pass"}
          
        })),
        ...failureTestSongList.map(f => ({
          file: f,
          songTestOptions: { expectedFailure: true, strictFile_styleNum: true, list: FAILURE_TEST_SONG_LIST_FILE, dir: SONGSTESTDIR, reason: "test-songs👍should-fail"}
          
        })),
        ...failureStrictTestSongList.map(f => ({
          file: f,
          songTestOptions: { expectedFailure: true, strictFile_styleNum: true, list: FAILURE_STRICT_TEST_SONG_LIST_FILE, dir: SONGSTESTDIR, reason: "test-songs👍should-fail-strict"}
          
        }))
    ];
    return theSongFilesArray;
  }

// ==== NEW code block for refactor of createSongFilesArray ============= 

//TODO: refactor createSongFilesArray() as createSongFilesArrayRefactored() leaving createSongFilesArray() alone. 
function createSongFilesArray_Refactored(masterListArray) {
  // masterListArray: array of songTestOptions objects, each with {list, dir, ...}
  // For each entry, load the song list, apply dir prefix, and build {file, songTestOptions}
  let theSongFilesArray = [];
  masterListArray.forEach(songTestOptions => {
    // Defensive: skip if no list or dir
    if (!songTestOptions.list || !songTestOptions.dir) return;
    // Use createSongList to get the song file names (with relDir if needed)
    // If dir is SONGSDIR, relDir is null; if dir is SONGSTESTDIR, relDir is SONGSTEST_RELDIR
    let relDir = null;
    if (songTestOptions.dir === SONGSTESTDIR) {
      relDir = SONGSTEST_RELDIR;
    }
    const songList = createSongList(songTestOptions.list, relDir);
    songList.forEach(f => {
      // Spread songTestOptions to avoid mutation
      theSongFilesArray.push({
        file: f,
        songTestOptions: { ...songTestOptions }
      });
    });
  });
  return theSongFilesArray;
}

function setUpMaster_songTestOptions_Array(){
    return [
      {
        expectedFailure: false,
        strictFile_styleNum: true,
        list: SONG_LIST_FILE,
        dir: SONGSDIR,
        reason: "library-songs👍pass"
      },
      {
        expectedFailure: false,
        list: TEST_SONG_LIST_FILE,
        dir: SONGSTESTDIR,
        reason: "test-songs👍pass"
      },
      {
        expectedFailure: true,
        strictFile_styleNum: true,
        list: FAILURE_TEST_SONG_LIST_FILE,
        dir: SONGSTESTDIR,
        reason: "test-songs👍should-fail"
      },
      {
        expectedFailure: true,
        strictFile_styleNum: true,
        list: FAILURE_STRICT_TEST_SONG_LIST_FILE,
        dir: SONGSTESTDIR,
        reason: "test-songs👍should-fail-strict"
      }
    ];
}
          

function setupHarsh_songTestOptions_Array(){
  return theHarshListArray = [
      {
        expectedFailure: false,
        strictFile_styleNum: true,
        list: SONGSDIR+'song-list-harsh-test.json',
        dir: SONGSDIR,
        reason: "harsh-mode-songs👍fail"
      }
    ];
}

function setupTestdirHarsh_songTestOptions_Array(){
  return theHarshListArray = [
      {
        expectedFailure: true,
        strictFile_styleNum: true,
        list: SONGSTESTDIR+'test-song-list-harsh-test.json',
        dir:  SONGSTESTDIR,
        reason: "harsh-mode-songs👍fail"
      }
    ];
}

function setup_songTestOptions_Array_FromNamed(songlist) {
  // songlist is a relative path like "tests/test-song-list-harsh-test.json"
  const listFilename = SONGSDIR + songlist;
  const listPath = path.join(__dirname, '../../', listFilename);
  let fileContents;
  logVerbose(0, "🛈  Reading named file from env: "+INFINITE_NECK_SONGLIST
             +LFWS2+" found: "+listPath);
  try {
    fileContents = fs.readFileSync(listPath, 'utf8');
  } catch (e) {
    logVerbose(1, `🛑 Error reading songTestOptions file: ${listPath}`);
    throw e;
  }
  let parsed;
  try {
    parsed = JSON.parse(fileContents);
  } catch (e) {
    logVerbose(1, `🛑 Error parsing JSON in songTestOptions file: ${listPath}`);
    throw e;
  }
  // Strict structure enforcement
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !parsed.songTestOptions ||
    typeof parsed.songTestOptions !== 'object' ||
    !Array.isArray(parsed.songs)
  ) {
    logVerbose(1, `🛑 Strict structure violation in songTestOptions file: ${listPath}`);
    throw new Error('setup_songTestOptions_Array_FromNamed: JSON file must contain { songTestOptions: {...}, songs: [...] }');
  }
  // Build array of songTestOptions for each song
  return parsed.songs.map(songFile => ({
    ...parsed.songTestOptions,
    file: (parsed.songTestOptions.dir === SONGSTESTDIR ? SONGSTEST_RELDIR : '') + songFile,
    list: listFilename,
    dir: parsed.songTestOptions.dir || SONGSDIR,
    reason: parsed.songTestOptions.reason || ''
  }));
}


//for development, hard-code DO_HARSH_TEST and DO_MASTER_TEST:
const DO_HARSH_TEST = false;
const DO_MASTER_TEST = false;
const DO_TESTDIR_HARSH_TEST = true;

let songFiles = null;
if (INFINITE_NECK_SONGLIST){
    var arr = setup_songTestOptions_Array_FromNamed(INFINITE_NECK_SONGLIST);
    logVerbose(0, "  🧐 array: "+JSON.stringify(arr,null,4));
    songFiles = createSongFilesArray_Refactored(arr);
    logVerbose(0, "  🧐 songFiles : "+JSON.stringify(songFiles,null,4));
} else if (DO_MASTER_TEST){
    songFiles = createSongFilesArray_Refactored(setUpMaster_songTestOptions_Array());
} else if (DO_HARSH_TEST){
    songFiles = createSongFilesArray_Refactored(setupHarsh_songTestOptions_Array());
} else if (DO_TESTDIR_HARSH_TEST){
    songFiles = createSongFilesArray_Refactored(setupTestdirHarsh_songTestOptions_Array());
} else {
    //Do it the way we did before the refactor:
    songFiles = createSongFilesArray();
} 

// ==== END NEW code block for refactor of createSongFilesArray =============



// Filter to a single song if INFINITE_NECK_SONG is set
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
                  +LF+"    • expectedFailure:"+songTestOptions.expectedFailure
                  +LF+"    • summary:"+JSON.stringify({expectedSections, sectionRootIDs, song_rootID: data.rootID})
                  +LF+"    • songTestOptions:"+JSON.stringify(songTestOptions));
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
    logVerbose(3, '👉   leaving test block ⠶ '+file
       +LF+"   • expectedFailure:"+songTestOptions.expectedFailure
                  +LF+"     • songTestOptions:"+JSON.stringify(songTestOptions));
    // --- End Structure and Summary Validation ---
  } catch (e) {
    logVerbose(3, '👉   caught exception ⠶ '+file
                  +LF+"     • expectedFailure:"+songTestOptions.expectedFailure
                  +LF+"     • songTestOptions:"+JSON.stringify(songTestOptions));
    failed = true;
    // Always log filename and summary info with exception
    const summaryStr = VERBOSE_MODE > 1
            ? JSON.stringify(summaryInfo, null, 4) 
            : JSON.stringify(summaryInfo);
    const jestException = VERBOSE_MODE > 1
            ? `${e.message}\n${e.stack}`
            : `${e.message}\n`;
    errorMsg = 
      `\n🛑 Failure in file: ${file} :: sections[${currentSectionIndex}]\n    • Summary: ${summaryStr}`
                +LF+"    • expectedFailure:"+songTestOptions.expectedFailure
                +LF+`    • failed: ${failed}`
                +`\n✴   Jest Exception: \n❮❮❮\n ${jestException}\n❯❯❯\n\n`;
    if (VERBOSE_MODE>0) {
      errorSummary = errorMsg;
      let dump = "";
      if (VERBOSE_MODE>2){
        dump = LF+LF+"⮮‾‾‾‾‾ Current Object"+LF+currentObjectDump+LF+"⮬______";  //
      }
      logVerbose(1, errorMsg + dump);
    } else {
      errorSummary = '';
    }
  }
  logVerbose(3, '🎄   preparing to run final expect ⠶ '+file
                  +LF+"  • expectedFailure:"+songTestOptions.expectedFailure
                  +LF+`  • failed: ${failed}`
                  +LF+"  • songTestOptions:"+JSON.stringify(songTestOptions));

  
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
  logVerbose(2, "🛈  Song Files to be tested with songTestOptions: "+LF+JSON.stringify(songFiles,null,4));
  songFiles.forEach(({ file, songTestOptions }) => {
    const filePath = path.join(__dirname, '../../songs', file);
    accumFilename.push(`${filePath}`);
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e){
      logVerbose(1, `🛈 File list so far: ${LF}${accumFilename.join(LF)}`)
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

