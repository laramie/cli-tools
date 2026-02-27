/*  Copyright (c) 2023, 2024 Laramie Crocker http://LaramieCrocker.com  */

//Static functions handling recorded notes in a Section.  Kept out of song.js to keep the recording logic in one place.
//Of course, this picks up the gSong reference from infinite-neck.js via getCurrentSection().
import {
	getSong,
	getCurrentSection
} from './infinite-neck.js';



	function getRecordedNotesForSection(){
	    if (!getCurrentSection().recordedNotes){
	       getCurrentSection().recordedNotes = {}
	    }
	    return getCurrentSection().recordedNotes;
	}

	function clearRecordedNotes(){
      clearHighlights();
	}

    function recordHighlight(doEraseHighlight, styleNum, sBeatNum, midinum, cellrow, noteName) {
        var recNote = newNote();
        recNote.midinum = midinum;
        recNote.row = cellrow;
        recNote.styleNum = styleNum;
		recNote.noteName = noteName; //automaticColorScheme

        var recordedNotes = getRecordedNotesForSection();
        var notesInBeatArr = recordedNotes[sBeatNum];
        if (!notesInBeatArr){
          recordedNotes[sBeatNum] = [];
        }
        //MOJO TODO:  recordedNotes[sBeatNum] = [];//always hose the array in single-highlight--only one allowed.
        if (!doEraseHighlight){
          recordedNotes[sBeatNum].push(recNote);
        }
        //console.log("noteHighlight:"+JSON.stringify(recordedNotes, null, 2));
    }

    function recordHighlightSingle(doEraseHighlightSingle, styleNum, sBeatNum, midinum, cellrow, noteName){
        var recNote = newNote();
        recNote.midinum = midinum;
        recNote.row = cellrow;
        recNote.styleNum = styleNum;
		recNote.noteName = noteName; //automaticColorScheme

        var recordedNotes = getRecordedNotesForSection();
        var notesInBeatArr = recordedNotes[sBeatNum];
        if (!notesInBeatArr){
            recordedNotes[sBeatNum] = [];
        }
        function callbackRemoveMIDIPITCHES(element, index, array){
            if (element.styleNum == STYLENUM_MIDIPITCHES){
                return false;
            }
            return true;
        }
        recordedNotes[sBeatNum] = recordedNotes[sBeatNum].filter(callbackRemoveMIDIPITCHES);
        if (doEraseHighlightSingle){
			var newArray =
			    filterOutMidinumRowStyleNum(recordedNotes, sBeatNum, recNote);
			recordedNotes[sBeatNum] = newArray;
        } else {
            recordedNotes[sBeatNum].push(recNote);
        }
    }

    function recordPlayedNote(sBeatNum, recNote){
        var recordedNotes = getRecordedNotesForSection();
        var notesInBeatArr = recordedNotes[sBeatNum];
        if (!notesInBeatArr){
            recordedNotes[sBeatNum] = [];
        }
        recordedNotes[sBeatNum].push(recNote);
    }

	function recordingHasPlayedNote(sBeatNum, proxyNote){
		function filterForNote(element, index, array){
            if (element.midinum == proxyNote.midinum
				&& element.row == proxyNote.row
				&& element.styleNum == proxyNote.styleNum){
				  return true;
			}
			return false;
        }
		var recordedNotes = getRecordedNotesForSection();
		var notesInBeatArr = recordedNotes[sBeatNum];
		if (!notesInBeatArr){
			return false;
		}
		return recordedNotes[sBeatNum].filter(filterForNote).length>0;
	}

	function unRecordPlayedNote(sBeatNum, recNote){
		getRecordedNotesForSection()[sBeatNum] = filterOutMidinumRowStyleNum(getRecordedNotesForSection(), sBeatNum, recNote);
	}

	function filterOutMidinumRowStyleNum(recordedNotes, sBeatNum, recNote){
		function callbackRemoveNotesWith_midinum_row_styleNum(element, index, array){
			if (element.midinum == recNote.midinum
				&& element.row == recNote.row
				&& element.styleNum == recNote.styleNum){
				  return false;
			}
			return true;
		}
		var newArray = recordedNotes[sBeatNum].filter(callbackRemoveNotesWith_midinum_row_styleNum);
		return newArray;
	}
