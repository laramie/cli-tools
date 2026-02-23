/**
 * @typedef {Object} Song
 * @property {function(boolean):void} gotoNextSection
 * @property {function():void} replay
 * @property {function():void} getCurrentSection
 * // ...add other methods you use...
 */

/**
 * @returns {Song}
 */
function makeSong(){
    const DEFAULT_BEATS = 4;
    const noteNamesFuncArrDEFAULT = [
	    "I", // 1 - I    I
	    "&tau;", //"&tau;", // 2 - Tau    was: "&#x1D70F;"
	    "II", // 3 - II
	    "m", // 4 - m
	    "III", // 5 - 3
	    "IV", // 6 - IV
	    "&Theta;", // 7 - Tri
	    "V", // 8 - V
	    "&sigma;", // 9 - Sigma
	    "6", // 10 - VI
	    "&delta;", // 11 - dom
	    "&Delta;" // 12 - I
	];

    const FRET_LENGTHS_ARRAY = (() => {
		var width = 60;
		var L0 = 1;  //tuned length, (L-sub-zero)
		const MAGIC_RATIO = 0.9438743;      //hand calculated from equation for fret ratios.
		const FIRSTFRET_LENGTH = 0.05297;   //hand calculated from equation for fret ratios.
        const fretLengths = [];
		for (var n=2; n<=NUM_FRETS_MAX+1; n++){
			var Cn = (Math.pow(MAGIC_RATIO, n));
			var Cnm1 = (Math.pow(MAGIC_RATIO, (n-1)));
			var R = (L0*(1-Cn)-L0*(1-Cnm1))/FIRSTFRET_LENGTH ; //0.05297 is the length of the first fret, if tuned length is 1.
			fretLengths.push(R);
		}
        return fretLengths;
    })();

    let obj = {
        //FIELDS:
            sections: null,
        	gSectionsCurrentIndex: 0,
            gFirstBeatSeen: false,
            userInstrumentTuning: null,
            gSongModelListener: null,
            noteNamesFuncArr: noteNamesFuncArrDEFAULT,
            sharps: false,
            captionsRowShowing: false,
            fretLengths: FRET_LENGTHS_ARRAY,
            presentationMode: false,
            constructing: false,
        //METHODS:
            make: construct_gSections,

            getCurrentSection: getCurrentSection,
            getSectionsCurrentIndex: getSectionsCurrentIndex,
            getRelativeSectionWithWrap: getRelativeSectionWithWrap,
            test_getRelativeSectionWithWrap: test_getRelativeSectionWithWrap,
            constructSection: constructSection,

            getSections: getSections,
            addSection: addSection,
            addSections: addSections,
            addSectionAfterCurrent: addSectionAfterCurrent,
            removeAllSections: removeAllSections,

            getBeat: getBeat,
            incBeat: incBeat,
            incBeatLoop: incBeatLoop,
            decBeat: decBeat,
            getBeats: getBeats,
            setBeats: setBeats,
            deleteBeat: deleteBeat,
            prevBeat: prevBeat,
            nextBeat: nextBeat,
            prevNextBeat: prevNextBeat,
            gotoFirstBeat: gotoFirstBeat,
            moveBeatsLater: moveBeatsLater,

            firstSection: firstSection,
            lastSection: lastSection,
            prevSection: prevSection,
            nextSection: nextSection,
            gotoSection: gotoSection,
            gotoNextSection: gotoNextSection,
            gotoPrevSection: gotoPrevSection,

            insertSectionAtDest: insertSectionAtDest,
            newSection: newSection,
            addShallowCloneSection: addShallowCloneSection,
            addDeepCloneSection: addDeepCloneSection,
            addCloneSection: addCloneSection,
            deleteCurrentSection: deleteCurrentSection,
            isEmpty: isEmpty,
            moveSectionToEND: moveSectionToEND,
            moveSectionTo: moveSectionTo,

            cycleThruKeysAllSections: cycleThruKeysAllSections,

            getTableArrInCurrentSection: getTableArrInCurrentSection,
            getTableArrInSection: getTableArrInSection,

            removeUnusedTablesFromMemoryModel: removeUnusedTablesFromMemoryModel,
            markVisibleTablesForFileSave: markVisibleTablesForFileSave,
            getTuningHashInMemoryModel: getTuningHashInMemoryModel,
            removeNotePlayedFromTable: removeNotePlayedFromTable,
            exportFromTable: exportFromTable,
            moveNamedNotesAllSections: moveNamedNotesAllSections,
            moveNamedNotes: moveNamedNotes,
            moveNamedNotesForSection: moveNamedNotesForSection,

            getRootKey: song_getRootKey,
            getLeadKey: song_getRootKeyLead,
            getLeadNoteName: song_getLeadNoteName,
            getRootNoteName: song_getRootNoteName
    }
    obj.make();
    return obj;




	function construct_gSections(){
        this.constructing = true;
    	this.sections = [];
    	this.visibleNoteTables = [];
        this.colorDicts = {};
    	this.defaultBPM = "80";
        this.rootID = "3";
        this.gSectionsCurrentIndex = this.addSection(this.constructSection());
	    this.namedNoteOpacity = "1.00";
	    this.singleNoteOpacity = "1.00";
        //this.sharps = false;
        this.constructing = false;
        delete this.constructing;
    }

    function getCurrentSection(){
	    return this.sections[this.gSectionsCurrentIndex];
	}

    function test_getRelativeSectionWithWrap(){
        const test = (sAmount) => {
            let currIdx = this.getSectionsCurrentIndex();
            let section = this.getRelativeSectionWithWrap(sAmount);
            console.log("test-relative:"+sAmount+" ["+currIdx+"]==> key:"+section.rootID+" caption:"+section.caption);
        }
        test("-2");
        test("-1");
        test("-0");
        test("0");
        test("1");
        test("2");
        test("3");
        test("@2");
        test("@1");
        test("@0");
        test("@-0");
        test("@-1");
        test("^0");
        test("^1");
        test("^2");
        test("^-1");
        test("&-1");
        test("&-0");
        test("&0");
        test("&1");
        test("&2");
        test("&3");
        test("&4");
        test("foo");
        test("+foo");
        test("-foo");
        test("+");
        test("-");
        test("");
    }

    /*   Support
     *   +3   3 sections ahead, with wrap
     *   -3   3 sections back, with wrap
     *   -1   previous section, with wrap
     *   +1   next section, with wrap
     *    1   Section 1 absolute (there always must be one section)
     *    2   Section 2 absolute, or last if num too large
     *    @1  Last section played in Random mode
     *    @2  Two sections ago played in Random mode
     *    ^1  previous section, no wrap, just go as early as you can, max is Section 1
     *    ^2  2 sections back, no wrap, just go as early as you can, max is Section 1
     *    &1  1 section ahead, no wrap, max is last Section
     *    &2  2 sections ahead, no wrap, max is last Section
     * 
     *    Negative signs after the first character are ignored, so @-1 is the same as @1, and --1 is the same as -1.
     *     So you can go "back" with -1 or ^1 or @1, and --1, ^-1, and @-1 are identical, respectively.
    */
    function getRelativeSectionWithWrap(sAmount){
        const Direction = Object.freeze({
            FORWARD:         '+',
            BACKWARD:        '-',
            ABSOLUTE:        'A',
            PREVIOUS_PLAYED: '@',  // legal values for full string: "@-2" or "@2" or "@+2"
            BACKWARD_NOWRAP: '^',  // legal values: ^1 ^2  go backwards.  No minus sign.
            FORWARD_NOWRAP:  '&',  // legal value: &1 &2 go forwards. No minus signs.
            BAD_INPUT:       'X',
            EMPTY:           'E'
        });
        var firstChar = Direction.EMPTY; //TODO: fix this.

        if (sAmount && sAmount[0]){
            // Extract firstChar if present
            const match = sAmount.match(/^([+\-@^&])([-+]?\d+)/);
            let firstChar = null;
            let intNum = 0;
            let isnum = false;
            if (match) {
                firstChar = match[1];
                // Try to parse the integer part
                intNum = Math.abs(parseInt(match[2], 10));
                isnum = /^[-+]?\d+$/.test(match[2]);
                if (!isnum){
                    firstChar = Direction.BAD_INPUT;
                }
            } else {
                // If no special char, check for pure integer
                if (/^[-+]?\d+$/.test(sAmount)) {
                    firstChar = Direction.ABSOLUTE;
                    intNum = Math.abs(parseInt(sAmount, 10));  //deal with the illegal --2.
                    isnum = true;
                } else {
                    // Malformed input: neither special char nor integer
                    firstChar = Direction.BAD_INPUT;
                    intNum = 0;
                    isnum = false;
                    console.warn("Malformed section amount: ", sAmount);
                }
            }
            var currentIndex = this.gSectionsCurrentIndex;
            function wrap(oneBasedDistance, sectionsArray, currentZeroBasedIndex){
                const n = sectionsArray.length;
                const wrappedIndex = ((currentZeroBasedIndex + oneBasedDistance) % n + n) % n;
                return wrappedIndex;
            }

            if (intNum === 0){
                firstChar = Direction.BAD_INPUT;
            }

            switch (firstChar){
                case Direction.BAD_INPUT:
                case Direction.EMPTY:
                    return this.sections[currentIndex];
                case Direction.ABSOLUTE: //(number only, goto num or max)
                    if (intNum > this.sections.length){
                        return this.sections[this.sections.length-1];                           
                    }
                    return this.sections[intNum-1];
                case Direction.PREVIOUS_PLAYED:  //(@)  TODO: this needs to use a stored list of previously played sections if Random Looping.
                    intNum = -1*Math.abs(intNum);  
                    //fall through for now, use the FORWARD/BACKWARD logic.
                case Direction.FORWARD: // (+)
                    var wrappedIndex = wrap(intNum, this.sections, currentIndex);
                    return this.sections[wrappedIndex];
                case Direction.BACKWARD: //(-)
                    var wrappedIndex = wrap( -1 * intNum, this.sections, currentIndex);
                    return this.sections[wrappedIndex];
                case Direction.BACKWARD_NOWRAP:  //(^)
                    return this.sections[Math.max(0, (currentIndex - Math.abs(intNum)))];
                case Direction.FORWARD_NOWRAP:   //(&)
                    var idx = (currentIndex + Math.abs(intNum))
                    var maxidx = this.sections.length-1;
                    return this.sections[(idx > maxidx) ? maxidx : idx];
            }
        } else {
            return this.getCurrentSection();        
        }
    }

    function getSectionsCurrentIndex(){
        return this.gSectionsCurrentIndex;
    }

    function song_getRootKey(){
        var rootIndex = toInt(this.getCurrentSection().rootID, 0);
        return noteIDToNoteName(rootIndex);
    }

    // This all works with Section objects, but JSON doesn't revive them. Working on the reviver, but for now, don't use.
    function constructSection(){
	    let result = {
            getRootKey: section_getRootKey,
            getRootKeyLead: section_getRootKeyLead,
            getLeadNoteName: section_getLeadNoteName,
            getRootNoteName: section_getRootNoteName,
            cloneFrom: cloneFrom,
            make: section_constructor
        };
        result.make();
        result.sharps=this.sharps;
        return result;
        function section_constructor(){
    	    this.noteTables = {};
    	    this.namedNotes = {};
    	    this.recordedNotes = {};
    		this.caption = "";
    	    this.rootID = $("#dropDownRoot").val();
    		this.rootIDLead = "-1";

            var beatsPer = DEFAULT_BEATS;
    	    this.beats = beatsPer;
    		this.currentBeat = 1;
    	    //this.sharps = parentSong.sharps;
            this.sharps = false;
    	}
        function cloneFrom(other){
            this.noteTables = other.noteTables;
            this.namedNotes = other.namedNotes ;
            this.recordedNotes = other.recordedNotes ;
            this.caption = other.caption ;
            this.rootID = other.rootID ;
            this.rootIDLead = other.rootIDLead ;
            this.beatsPer = other.beatsPer ;
            this.beats = other.beats ;
            this.currentBeat = other.currentBeat ;
            this.sharps = other.sharps ;
            this.noteNamesFuncArr = other.noteNamesFuncArr; 
        }

        //these two return an html string that is either sharps or flats, depending on section.
        function section_getRootKey(){
            var rootIndex = toInt(this.rootID, 0);
    		return noteIDToNoteName(rootIndex);
        }
        function section_getRootKeyLead(){
    		var leadkey =  noteIDToNoteName(toInt(this.rootIDLead, 0));
            if (!leadkey){
                return noteIDToNoteName(toInt(this.rootID, 0));
            }
            return leadkey;
        }

        //these two return a simple noteName, one of [A, Bb, B, C, Db, ...etc.]
        function section_getRootNoteName(){
            return noteIDToNoteNameRaw(toInt(this.rootID, 0));
        }
        function section_getLeadNoteName(){
            if (this.rootIDLead == "-1"){
                return noteIDToNoteNameRaw(toInt(this.rootID, 0));
            }
            return noteIDToNoteNameRaw(toInt(this.rootIDLead, 0));
        }
    }

    function removeAllSections(){
        this.sections = [];
        this.addSection(this.constructSection());
    }

	function addSection(section){
	    var newIndex = this.sections.push(section) - 1;
	    this.gSectionsCurrentIndex = newIndex;
	    if (!this.constructing) updateSectionsStatus(this);
	    return newIndex;
	    // sections is an array of gNotesPlayed objects. push() returns length.
	}
	function addSectionAfterCurrent(section){
        if (this.sections.length == 0){
            this.sections.push(section);
            this.gSectionsCurrentIndex = 0;
        } else {
    		var deleteCount=0;
    		var start = this.gSectionsCurrentIndex+1;
    	    var newIndex = this.sections.splice(start, deleteCount, section);
            this.gSectionsCurrentIndex = this.gSectionsCurrentIndex+1;
        }
        fullRepaint();
	    updateSectionsStatus();
	    return this.gSectionsCurrentIndex;
	    // sections is an array of gNotesPlayed objects.
	}
	function getSections(){
	    return this.sections;
	}
	function addSections(fileObj){
	    if (this.sections.length==1 && isEmpty(this.sections[0])){
	        //special case: file open is adding sections, but default section is empty, so delete it.
	        this.sections = [];
	    }
	    var count = Array.prototype.push.apply(this.sections, fileObj.sections);
        this.gSectionsCurrentIndex = count - 1;
	}

    //these two return an html string that is either sharps or flats, depending on section.
    function song_getRootKey(){
        var rootIndex = toInt(this.getCurrentSection().rootID, 0);
        return noteIDToNoteName(rootIndex);
    }
    function song_getRootKeyLead(){
        var leadkey =  noteIDToNoteName(toInt(this.getCurrentSection().rootIDLead, 0));
        if (!leadkey){
            return noteIDToNoteName(toInt(this.getCurrentSection().rootID, 0));
        }
        return leadkey;
    }

    //these two return a simple noteName, one of [A, Bb, B, C, Db, ...etc.]
    function song_getRootNoteName(){
        return noteIDToNoteNameRaw(toInt(this.getCurrentSection().rootID, 0));
    }
    function song_getLeadNoteName(){
        if (this.getCurrentSection().rootIDLead == "-1"){
            return noteIDToNoteNameRaw(toInt(this.getCurrentSection().rootID, 0));
        }
        return noteIDToNoteNameRaw(toInt(this.getCurrentSection().rootIDLead, 0));
    }

	function getBeat(){
	    var beat = toInt(this.getCurrentSection().currentBeat, 1);
	    this.getCurrentSection().currentBeat = beat;
	    return beat;
	}
	function incBeat(){
	    var beat = getBeat();
	    var beats = getBeats();
	    if (beat >= beats){
	        beat = beats;
	        return beat;
	    }
	    beat++;
	    this.getCurrentSection().currentBeat = beat;
	    return beat;
	}
	function incBeatLoop(){
	    var beat = this.getBeat();
	    var beats = this.getBeats();
		beat++;
	    if (beat > beats){
	        beat = 1;
	    }
	    this.getCurrentSection().currentBeat = beat;
	    return beat;
	}
	function decBeat(){
	    var beat = this.getBeat();
	    var beats = this.getBeats();
	    if (beat <= 1){
	        beat = 1;
	        return beat;
	    }
	    beat--;
	    this.getCurrentSection().currentBeat = beat;
	    return beat;
	}

	function getBeats(){
        var curr = this.getCurrentSection();
        if (!curr){
            console.log("WARNING: this.getCurrentSection() returned undefined in song.getBeats().");
            return DEFAULT_BEATS;
        }
	    var beats = toInt(curr.beats, -1);
	    if (beats < 1){
	        beats = DEFAULT_BEATS;
	        this.getCurrentSection().beats = ""+beats;
	    }
	    return beats;
	}
	function setBeats(newValue){
		this.getCurrentSection().beats = newValue;
	}


	function gotoFirstBeat(){
	    this.getCurrentSection().currentBeat = 1;
	    this.gFirstBeatSeen = false;
	}

	function moveBeatsLater(){
		var result = {};
		var beatCount = getBeats();
		var notes = getRecordedNotesForSection();
		for (var i=1; i<=beatCount; i++){
			result[""+(i+1)] = notes[""+i];
		}
		result["1"] = [];
		this.getCurrentSection().recordedNotes = result;
		this.setBeats(beatCount+1);
        gotoFirstBeat();
		updateSectionsStatus();
        fullRepaint();
        showBeats();
	}

    function shuffleRecordedBeatsDown(recordedBeats, nBeats, nStartBeat){
  	  for (var curr=nStartBeat; curr<=nBeats; curr++){
  		if (recordedBeats[curr]){
  			delete recordedBeats[curr];
          }
  		if ( (curr+1 <= nBeats) && recordedBeats[curr+1] ){
  			recordedBeats[curr]=recordedBeats[curr+1];
  		}
  	  }
  	  return recordedBeats;
    }

    function deleteBeat(){
         var nStartBeat = this.getBeat();
         var nBeats = this.getBeats();
         if (nBeats <=1){
        	 console.log("Can't delele beat #1. returning.");
        	 return;
         }
         var recordedNotes = this.getCurrentSection().recordedNotes;
         if (recordedNotes){
        	 this.getCurrentSection().recordedNotes = shuffleRecordedBeatsDown(recordedNotes, nBeats, nStartBeat);
         }
         this.setBeats(nBeats-1);
         var currBeat = nStartBeat > this.getBeats() ? this.getBeats() : nStartBeat;
         this.getCurrentSection().currentBeat = currBeat;
         updateSectionsStatus();
         showBeats();
    }

    function prevBeat(){
  	  this.prevNextBeat(false);
    }

    function nextBeat(){
  	  this.prevNextBeat(true);
    }

    function prevNextBeat(isNext){
            clearHighlights();
            /*
            var jLblCurrentBeat = $("#lblCurrentBeat");
  	        var sBeats = $("#txtBeatsPer").val();
  	        if (sBeats == ""){
  	            gSong.addBeat();
  	            sBeats = $("#txtBeatsPer").val();
  	        }
            */

  	        var beat  = this.getBeat();
  	        var beats = this.getBeats();

            if (isNext){
  	            if (beat < beats){
  	               this.incBeat();
  	            }
  	        } else {
  	            if (beat > 1){
  	               this.decBeat();
  	            }
  	        }
  	        //jLblCurrentBeat.text(gSong.getBeat());
  	        //$("#lblBeat").html(""+gSong.getBeat());
            updateSectionsStatus();
  			showBeats();
    }


    //============== Section handling =====================================

	function firstSection(){
	    this.gSectionsCurrentIndex = 0;
	    sectionChanged();
	}

	function lastSection() {
		 this.gSectionsCurrentIndex = this.sections.length-1;
		 sectionChanged();
	}

	function prevSection(){
	    if (this.gSectionsCurrentIndex > 0){
	        this.gSectionsCurrentIndex--;
	    }
	    sectionChanged();
	}
	function nextSection(){
	    if (this.gSectionsCurrentIndex < (this.sections.length-1)){
	        this.gSectionsCurrentIndex++;
	    }
	    sectionChanged();
	}
    function gotoSection(idx){
        var sectionIdx = toInt(idx, -1);
        if (sectionIdx > -1 && sectionIdx < this.sections.length){
            this.gSectionsCurrentIndex = sectionIdx;
            clearAndReplaySection();
            sectionChanged();
        }
    }

    function gotoNextSection(orGotoFirst){
        var isRandom = this.randomLoop == true;
        if (isRandom) {
            var rand = Math.random();
            var randSection = Math.floor(rand*this.sections.length);
            if (randSection == this.gSectionsCurrentIndex){
                for (var r = 0; r<10; r++){
                    rand = Math.random();
                    randSection = Math.floor(rand*this.sections.length);
                    if (randSection != this.gSectionsCurrentIndex){
                        break;
                    }
                }
            }
            this.gSectionsCurrentIndex = randSection;
            console.log("Random:"+(rand*this.sections.length)+" section:"+randSection);
        } else if (this.getSectionsCurrentIndex()+1 >= this.sections.length){
            if( orGotoFirst ) this.firstSection();
		} else {
			this.nextSection();
		}
		clearAndReplaySection();
	}

	function gotoPrevSection(orGotoLast){
		if (this.getSectionsCurrentIndex()==0){
			if( orGotoLast ) this.lastSection();
		} else {
			this.prevSection();
		}
		clearAndReplaySection();
	}

    function insertSectionAtDest(aSection, destIndex){
        if (destIndex == "END"){
            this.sections.push(aSection);
            this.gSectionsCurrentIndex = this.sections.length-1;
        } else if (destIndex == "BEGIN"){
            this.sections.splice(0, 0, aSection);  //insert BEFORE first current.
            this.gSectionsCurrentIndex = 0;
        } else {
            var iDest = toInt(destIndex, -1);
            if (iDest<=-1){
                alert("bad index in addCloneSection: "+destIndex);
                this.addSectionAfterCurrent(aSection);
            } else {
                iDest = iDest + 1; //insert AFTER named section.
                this.sections.splice(iDest, 0, aSection);
                if (iDest >= this.sections.length){
                    this.gSectionsCurrentIndex = this.sections.length - 1;
                } else {
                    this.gSectionsCurrentIndex = iDest;
                }
            }
        }
    }

	function newSection(destIndex){
	    var aSection = this.constructSection();  //populates rootID from dropDownRoot.
	    if (destIndex){
            this.insertSectionAtDest(aSection, destIndex);
        } else {
            this.addSectionAfterCurrent(aSection);
        }
        clearAll();
	    this.gotoFirstBeat();
	    sectionChanged();//updateSectionsStatus();
	}

	function addShallowCloneSection(destIndex){
	    return this.addCloneSection(false, destIndex);
	}
	function addDeepCloneSection(destIndex){
	    return this.addCloneSection(true, destIndex);
	}
	function addCloneSection(deep, destIndex){
	    var aSection = this.constructSection();  //populates rootID from dropDownRoot.
	    aSection.namedNotes = JSON.parse(JSON.stringify(this.getCurrentSection().namedNotes));
	    aSection.rootID = this.getCurrentSection().rootID;          //$("#dropDownRoot").val();
		aSection.rootIDLead = this.getCurrentSection().rootIDLead;  //$('#dropDownRootLead').val(); //foobar: or: use value from getCurren Section...
	    aSection.caption = this.getCurrentSection().caption;
	    aSection.beats = this.getCurrentSection().beats;
	    aSection.currentBeat = 1;
	    if (deep){
	        aSection.noteTables = JSON.parse(JSON.stringify(this.getCurrentSection().noteTables));
     	    aSection.recordedNotes = JSON.parse(JSON.stringify(this.getCurrentSection().recordedNotes));
	    }
        if (destIndex){
            this.insertSectionAtDest(aSection, destIndex);
        } else {
    		this.addSectionAfterCurrent(aSection);
        }
		clearAll();
	    resetNoteNames();//calls replay
	    //updateSectionsStatus();
	    sectionChanged();//calls updateSectionsStatus...TODO might be one too many calls in this chain--could cleanup for efficiency
	    return aSection;
	}

	function deleteCurrentSection(){
	    var obj = this.getCurrentSection();
        var context = {"SectionIndex": this.getSections().indexOf(obj),
                       "caption": obj.caption
                      };
        this.graveyard.bury(GraveType.SECTION, obj, context);

        if (this.sections.length<=1){
	        console.log("Can't remove only section. Clearing instead.");
	        this.sections = [];
            this.gSectionsCurrentIndex = 0;
	        this.newSection();
	        return false;
	    }

        this.sections.splice(this.gSectionsCurrentIndex, 1);
	    this.prevSection();
	    clearAll();
	    replay();
        sectionChanged();
        //fullRepaint();
		return true;
	}

	function isEmpty(section){
	   var namedNoteCount = 0;
	   var tableCount = 0;
	   for (const noteName in section.namedNotes){
	        namedNoteCount++;
	    }
	    for (const tablename in section.noteTables){
	        var tablearr = section.noteTables[tablename];
	        tableCount += tablearr.length;
	    }
	    return ((tableCount + namedNoteCount) == 0);
	}

    function moveSectionToEND(){
		var section = this.getCurrentSection();
        var arr = this.sections;
	    arr.push(arr.splice(this.gSectionsCurrentIndex, 1)[0]);
        this.lastSection(); //calls clear and update
	}

	function moveSectionTo(newIndex){
        if (newIndex > this.sections.length-1){
            alert("moveSectionTo can't move to section index: "+newIndex+" because sections.length = "+this.sections.length);
            return;
        }
        var oldIndex = this.gSectionsCurrentIndex
        this.sections.splice(newIndex, 0, this.sections.splice(oldIndex, 1)[0]);
        this.gotoSection(newIndex);  //calls clear and update
	}

    //=============== Model Management/Cleanup Functions ==========================================

    //This function works: it transposes every Section in a Song by 'amount', but I haven't installed it in the menu yet.
    function cycleThruKeysAllSections(amount){
        var sections = this.getSections();
		for (var idx in sections){
            var section = sections[idx];
			var curr = toInt(section.rootID, 0);
			curr=(12+curr + amount) % 12;
			section.rootID = curr;
		}
	}

    function getTableArrInCurrentSection(tableID){
	    return getTableArrInSection(this.getCurrentSection(), tableID);
	}

	function getTableArrInSection(section, tableID){
	    var tableArr = section.noteTables[tableID];
	    if (!tableArr){
	        section.noteTables[tableID] = [];
	        tableArr = section.noteTables[tableID];
	    }
	    return tableArr;
	}


    function removeUnusedTablesFromMemoryModel(){
	  for (sectionIdx in this.sections){     //for all sections...
	    var section = this.sections[sectionIdx];
	    var tempTables = {};
	    for (const tablename in section.noteTables){
	        var tablearr = section.noteTables[tablename];
	        if (tablearr && tablearr.length && tablearr.length>0){
	            tempTables[tablename] = tablearr;
	        }
	    }
	    section.noteTables = tempTables;
	  }
	}

    function markVisibleTablesForFileSave(){
	    this.visibleNoteTables = [];
	    for (i in allTunings.tunings){
	         var baseID = allTunings.tunings[i].baseID;
	         var divSelector = "#"+TABLEDIV_ID_PREFIX+baseID;
	         if ($(divSelector).is(':visible')) {
	             this.visibleNoteTables.push(TABLE_ID_PREFIX+baseID);
	         }
	    }
	    var tunings = getTunings(this.visibleNoteTables);
	    this.tunings = tunings;
	}

  function getTuningHashInMemoryModel(){
   var hashTuningNames = {};
   var section;
   for (sectionIdx in this.sections){     //for all sections...
	    section = this.sections[sectionIdx];
   	  for (const tablename in section.noteTables){
	        var tablearr = section.noteTables[tablename];
	        if (tablearr && tablearr.length && tablearr.length>0){
	            var tuningID = tablename.substring(TABLE_ID_PREFIX.length);
	            var val = hashTuningNames[tuningID];
	            if (!val){
	                val = tablearr.length;
	                hashTuningNames[tuningID] = val;
	                //console.log("section:"+sectionIdx+" tuningID:"+tuningID
	                //    +" val-len:"+val+" new: "+tablearr.length+" obj: "+JSON.stringify(hashTuningNames));
	            } else {
	                hashTuningNames[tuningID] = val + tablearr.length;
	                //console.log("section: "+sectionIdx+" tuningID:"+tuningID
	                //   +" val:"+val+" adding:"+tablearr.length+" obj:"+JSON.stringify(hashTuningNames));
	            }
	        }
	    }
	  }
	  return hashTuningNames;
	}


    function removeNotePlayedFromTable(notePlayed, parentTableID){
      var tableArr = this.getTableArrInCurrentSection(parentTableID);
      for (key in tableArr){
            var itemNotePlayed = tableArr[key];
            if (   itemNotePlayed.col == notePlayed.col
                && itemNotePlayed.row == notePlayed.row
                && itemNotePlayed.styleNum == notePlayed.styleNum  ){

                //console.log("found cell["+key+"] item: "+JSON.stringify(itemNotePlayed));
                tableArr.splice(key, 1);
                break;
            }
        }
    }

    function moveNamedNotesAllSections(amount){
        var sections = this.getSections();
		for (var idx in sections){
            var section = sections[idx];
	        moveNamedNotesForSection(amount, section);
		}
	}

    function moveNamedNotes(amount){
        return moveNamedNotesForSection(amount, this.getCurrentSection());

    }
    function moveNamedNotesForSection(amount, section){
    	var namedNotesClone = {};
    	var namedNotes = section.namedNotes;
    	for (const noteName in namedNotes){
            var index = constNoteNamesArr.indexOf(noteName);  //globally known list of A,Bb,B,C etc.
            index=(12+index + amount) % 12;
            var transposedNoteName = constNoteNamesArr[index];
            var otherNote = namedNotes[noteName];
            if (otherNote.colorClass){
                var clonedNote = newNote();
                clonedNote.cloneFrom(otherNote);
                clonedNote.noteName = transposedNoteName;
                //clonedNote.noteNameClass = ".note"+transposedNoteName;
                //delete clonedNote.noteNameClass;
                namedNotesClone[transposedNoteName] = clonedNote;
            }

    	}
    	section.namedNotes = namedNotesClone;
        //console.log("original: "+JSON.stringify(namedNotes) + "\r\n new:"+JSON.stringify(this.getCurrentSection().namedNotes));
    	return getRootNoteName(section);  //as we transpose, keep highlighting the rootID.
  	}

  	function getRootNoteName(section){
  		var noteID = parseInt( section.rootID );
  		var noteName = constNoteNamesArr[noteID];
  		return noteName;
  	}
}
