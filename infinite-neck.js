/*  Copyright (c) 2023, 2024 Laramie Crocker http://LaramieCrocker.com  */

	// You can draw lines using SVG!
	//  https://stackoverflow.com/questions/56722754/draw-a-line-from-one-element-to-another

	const SHARP = "&#9839;";
	const FLAT = "&#9837;";
	const NATURAL = "&nbsp;";
	const TUNINGS_PFX = "tunings-";

	const STYLENUM_NAMED = 0;
	const STYLENUM_TINY = 1;
	const STYLENUM_SINGLE = 2;
	const STYLENUM_MIDIPITCHES = 3;
	const STYLENUM_MIDIPITCHESSINGLE = 4;
	const STYLENUM_BEND = 5;
	const STYLENUM_FINGERING = 6;

	const NUM_FRETS_MAX = 108;

	const gBEND_CLASSES = "semitone1 semitone2 semitone3 prebend1 prebend2 prebend3 updown1 updown2 updown3"
						  +" semitone1LH semitone2LH semitone3LH prebend1LH prebend2LH prebend3LH updown1LH updown2LH updown3LH";

	const constNoteNamesArr       = "A,Bb,B,C,Db,D,Eb,E,F,Gb,G,Ab".split(',');

	const constNoteNamesArrFlats = "A,B<small>&#9837;</small>,B,C,D<small>&#9837;</small>,D,E<small>&#9837;</small>,E,F,G<small>&#9837;</small>,G,A<small>&#9837;</small>".split(',');

	const constNoteNamesArrSharps = "A,A<small>&#9839;</small>,B,C,C<small>&#9839;</small>,D,D<small>&#9839;</small>,E,F,F<small>&#9839;</small>,G,G<small>&#9839;</small>".split(',');

	function styleNumToCaption(styleNum){
		switch(styleNum){
			case STYLENUM_NAMED:
				return "Named";
			case STYLENUM_TINY:
				return "Tiny";
			case STYLENUM_SINGLE:
				return "Single";
			case STYLENUM_MIDIPITCHES:
				return "Pitch";
			case STYLENUM_MIDIPITCHESSINGLE:
				return "Multi";
			case STYLENUM_BEND:
				return "Bend";
			case STYLENUM_FINGERING:
				return "Fingering";
		}
		return "Unknown"+styleNum;
	}

	function noteNameToNoteID(noteName){
		return constNoteNamesArr.indexOf(noteName);
	}

	function noteIDToNoteName(noteIndex){
		var noteName;
		if (gSong.getCurrentSection().sharps){
	        noteName = constNoteNamesArrSharps[noteIndex];
	    } else {
	        noteName = constNoteNamesArrFlats[noteIndex];
	    }
		return noteName;
	}

	function noteIDToNoteNameRaw(noteIndex){
		return constNoteNamesArr[noteIndex];
	}

	//==========================================================================

	var gSong = null;  //constructed in document ready.

	function getCurrentSection(){
	    return gSong.getCurrentSection();
	}

	function getSectionsCurrentIndex(){
	    return gSong.getSectionsCurrentIndex();
	}

	function getSections(){
	    return gSong.getSections();
	}
	function getSong(){
		return gSong;
	}

	//==========================================================================

	function buildDropDownSectionOrderOptions(){
		var len = gSong.getSections().length;
		var curr = gSong.getSectionsCurrentIndex();
		var result = "<option value='BEGIN'>BEGIN</option>";
		for (var i=0; i<len; i++){
			var iStr = ""+(i+1);
			if (i==curr){
				result += "<option value='"+i+"' selected>"+iStr+"</option>";
			} else {
				result += "<option value='"+i+"'>"+iStr+"</option>";
			}
		}
		result += "<option value='END'>END</option>";
		return result;
	}

	function showHideDisplayOptionsPresent(){
		var options = getCurrentSection().displayOptions;
		if (options){
			$('#btnDeleteDisplayOptions,#btnDeleteDisplayOptions2').prop("disabled",false);
		} else {
			$('#btnDeleteDisplayOptions,#btnDeleteDisplayOptions2').prop("disabled",true);
		}
	}

	function sectionChanged(){
		$('#dropDownSectionOrder').html(buildDropDownSectionOrderOptions());
		$("#dropDownRoot").val(getCurrentSection().rootID);
	    $("#dropDownRootLead").val(getCurrentSection().rootIDLead);
		var options = getCurrentSection().displayOptions;
		if (options){
			displayOptionsToControls(options);
		}
		showHideDisplayOptionsPresent();
	    gSong.gotoFirstBeat();
	    showHighlightsForBeat(gSong.getBeat());
	    updateSectionsStatus();
	}

	function updateSectionsStatus(){
		$(".lblSectionsStatusSectionNo").html(""+(gSong.getSectionsCurrentIndex()+1));
	    var txt = ""+(gSong.getSectionsCurrentIndex()+1)+"/"+ gSong.sections.length;
	    $("#lblSectionsStatus").html(txt);
	    $("#lblSectionsStatus2").html(txt);
	    $("#txtBeatsPer" ).val(gSong.getBeats());
		$("#lblBeats").html(gSong.getBeats());
	    var jLblCurrentBeat = $("#lblCurrentBeat");
	    jLblCurrentBeat.text("1");
	    $("#lblBeat").html("1");

	    //clearRecordedNotes();
	    $("#txtCaption").val(gSong.getCurrentSection().caption);
	    var key =  gSong.getCurrentSection().rootID;
	    var rawCaption = gSong.getCurrentSection().caption;
		var caption = eval("\`"+rawCaption+"\`");
	    $(".lblSectionCaption").html(caption);

		var currentFilename = $("#txtFilename").val();
	    $(".lblSongName").html(currentFilename);
		//gSong.songName = currentFilename;

		var rootIndex = toInt(gSong.getCurrentSection().rootID, 0);
	    var rootIndexLead = toInt(gSong.getCurrentSection().rootIDLead, 0);
		var keyname = noteIDToNoteName(rootIndex);
		var keynameLead = noteIDToNoteName(rootIndexLead);

	    $(".lblRootID").html(keyname);

	    var spans = $(".spanLeadDifferentFromRoot");
	    if (gSong.getCurrentSection().rootIDLead != "-1"){
	        spans.html("lead key: "+keynameLead);
	        spans.show();
	        $(".lblRootIDLead").html(keynameLead).show();
	    } else {
          spans.hide();
          $(".lblRootIDLead").hide();//zanzibar
	    }
		showHideDisplayOptionsPresent();
	}

	function clearAndReplaySection(){
		gSong.gotoFirstBeat();
		clearAll();
		resetNoteNames(); //calls replay()
		updateSectionsStatus();
		showBeats();
		//prevSection calls this: updateSectionsStatus();

	}

	function showBeats(){
		var beat = gSong.getBeat();
		$("#lblBeat").html(""+beat);
		$("#lblCurrentBeat").text(""+beat);
		showHighlightsForBeat(beat);
	}

	function getMillisForCurrentSection(){
	    var beats = DEFAULT_BEATS_PER;
	    var sBeats = getCurrentSection().beats;
	    if (sBeats){
	        beats = parseInt(sBeats);
	    }

	    var bpm = getBPM();
	    var millisNextTimeout = (beats/bpm)*60*1000;
	    return millisNextTimeout;
	}

	function showBPM(){
		$(".bpm").html(getSong().defaultBPM+"<small>bpm</small>");
	}

	function setBPM(newValue){
		$("#txtBPM").val(newValue);
		getSong().defaultBPM = ""+newValue;
		showBPM();
	}

	function getBPM(){
	    var sBpm = $("#txtBPM").val();
	    var bpm = parseInt(sBpm);
	    if (Number.isNaN(bpm) || bpm == 0){
	        bpm = DEFAULT_BPM;
	    }
	    getSong().defaultBPM = ""+bpm;
	    return bpm;
	}

	function getMillisForBeatClock(){
	    var bpm = getBPM();
	    var fBpm =  (1/bpm)*60*1000;
	    return fBpm;
	}

	function reloadAllTuningsDisplay(){
	    var div = $('#divAllTunings');
	    div.empty();
	    div.append(dumpTuningsToTable(gSong.getTuningHashInMemoryModel()));
	    bindFormTuningsEvents();
	}

	function resetSharpsControls() {
	    //turn all to sharps
	    $(".ddnAb").html("G<small>&#9839;&nbsp;</small>");
	    $(".ddnBb").html("A<small>&#9839;&nbsp;</small>");
	    $(".ddnDb").html("C<small>&#9839;&nbsp;</small>");
	    $(".ddnEb").html("D<small>&#9839;&nbsp;</small>");
	    $(".ddnGb").html("F<small>&#9839;&nbsp;</small>");
	}

	function resetFlatsControls() {
	    //turn all to flats
	    $(".ddnAb").html("A<small>&#9837;</small>");
	    $(".ddnBb").html("B<small>&#9837;</small>");
	    $(".ddnDb").html("D<small>&#9837;</small>");
	    $(".ddnEb").html("E<small>&#9837;</small>");
	    $(".ddnGb").html("G<small>&#9837;</small>");
	}

	function resetSharps(options) {
	    buildCells(gSong.sharps, options);
	    resetSharpsControls();
	}

	function resetFlats(options) {
	    buildCells(gSong.sharps, options);
	    resetFlatsControls();
	}


	function resetNoteNames() {
	    var options = {};
	    var rootID = getCurrentSection().rootID;
	    gSong.sharps = getCurrentSection().sharps;
	    if (rootID!=null && ((""+rootID).length>0)) {
	        options.rootID = rootID;
			options.rootIDLead = getCurrentSection().rootIDLead;//20240423
	        //console.log("=========Using rootID from getCurrentSection(): "+rootID+" ");
	    } else {
	        var optVal = $('#dropDownRoot  option:selected').val();
			var rootIDLead = $("#dropDownRootLead").val();
	        options.rootID = parseInt(optVal);
			options.rootIDLead = toInt(rootIDLead, -2);
	        //console.log("==========NOT Using rootID:"+rootID+", using dropDownRoot value instead: "+optVal+" options.rootID: "+options.rootID);
	        getCurrentSection().rootID = options.rootID;
	        getCurrentSection().rootIDLead = options.rootIDLead;
	    }
	    options.showCellNotes = $("#cbShowCellNotes").prop("checked");
	    options.showSubscriptFunctions = $("#cbShowSubscriptFunctions").prop("checked");
	    options.cellIsFunction = ($('input[name="rbnFunctionNotename"]:checked').val() == "showFunction");
	    options.showMidiNum = $("#cbMidiNum").prop("checked");
		options.useCenterForRightFunction = $("#cbCenterForRightFunction").prop("checked");
		options.NoteDisplaySizes = {"width":$("#dropDownCellWidth").val(),"height":$("#dropDownCellHeight").val()};
		options.naturalFretWidths = $("#cbNaturalFretWidths").prop("checked");
		options.naturaFontScaling = toInt($('#selNaturaFontScaling option:selected').val(), 45);

	    if (gSong.sharps) {
	        resetSharps(options);
	        resetSharpsControls();
	    } else {
	        resetFlats(options);
	        resetFlatsControls();
	    }
		if ($("#rbNotename").prop("checked")) {
			$('#btnNoteV').addClass("BtnPunchedIn").removeClass("BtnPunchedOut");
			$('#btnFuncV').addClass("BtnPunchedOut").removeClass("BtnPunchedIn");
		} else if ($("#rbFunction").prop("checked")) {
			$('#btnFuncV').addClass("BtnPunchedIn").removeClass("BtnPunchedOut");
			$('#btnNoteV').addClass("BtnPunchedOut").removeClass("BtnPunchedIn");
		}
		replay();
	}

	function buildCells(sharps, options) {
		activityRebuild();
	    if (sharps) {
	        buildCellsFromSelector("td.noteAb", "G", SHARP, 11, options);
	        buildCellsFromSelector("td.noteBb", "A", SHARP, 1, options);
	        buildCellsFromSelector("td.noteDb", "C", SHARP, 4, options);
	        buildCellsFromSelector("td.noteEb", "D", SHARP, 6, options);
	        buildCellsFromSelector("td.noteGb", "F", SHARP, 9, options);
	    } else {
	        buildCellsFromSelector("td.noteAb","A", FLAT, 11, options);
	        buildCellsFromSelector("td.noteBb","B", FLAT, 1, options);
	        buildCellsFromSelector("td.noteDb","D", FLAT, 4, options);
	        buildCellsFromSelector("td.noteEb","E", FLAT, 6, options);
	        buildCellsFromSelector("td.noteGb","G", FLAT, 9, options);
	    }
	    buildCellsFromSelector("td.noteA","A", NATURAL, 0, options);
	    buildCellsFromSelector("td.noteB","B", NATURAL, 2, options);
	    buildCellsFromSelector("td.noteC","C", NATURAL, 3, options);
	    buildCellsFromSelector("td.noteD","D", NATURAL, 5, options);
	    buildCellsFromSelector("td.noteE","E", NATURAL, 7, options);
	    buildCellsFromSelector("td.noteF","F", NATURAL, 8, options);
	    buildCellsFromSelector("td.noteG","G", NATURAL, 10, options);
		activityRebuildDone();
	}

	//list of menu divs, accessed through .entries(), and associated button names,
	//  accessed through selectors stored in values with menu as key: AllMenuDivs[strMenuDiv]
	const AllMenuDivs = {
		"#palette": "#btnPalette",
		"#divFileControls": "#btnFileControls",
		"#divSectionControls": "#btnSectionControls",
		"#divViewControls": "#btnViewControls",
		"#divThemeControls": "#btnThemeControls",
		"#divFillNotes": "#btnFillNotes",
		"#divTunings": "#btnTunings",
		"#divDesktop": "#btnDesktop"
	}

	function hideAllMenuDivs(){
		for (const [key, value] of Object.entries(AllMenuDivs)){
			$(key).hide();
		}
		$('.MainMenuTabBtn').removeClass("BtnPunchedIn").addClass("BtnPunchedOut");
	    //$("#topControlsCaptions").show();
	 }

	 function showOneMenu(strMenuDiv){
		 var wasFull = leaveFullscreen();
		 var jStrMenuDiv = $(strMenuDiv);
		 if (wasFull){
			 hideAllMenuDivs();
			 jStrMenuDiv.show();
		 } else {
		     if (jStrMenuDiv.is(":visible") ){
				 hideAllMenuDivs();
		     } else {
				 hideAllMenuDivs();
		         jStrMenuDiv.show();
				 $(AllMenuDivs[strMenuDiv]).addClass("BtnPunchedIn").removeClass("BtnPunchedOut");
		     }
		 }
		 //$("#topControlsCaptions").hide();
		 scrollToTop();
	 }

	 function getHelpTopic(){
		 var anchor = "";
		 for (const [key, value] of Object.entries(AllMenuDivs)){
			 var jStrMenuDiv = $(key);
			 if (jStrMenuDiv.is(":visible")){
			 	anchor = key;
				break;
 			 }
 		 }
		 return  'help.html'+anchor;
	 }

	function exportFromTable(tblSource){
		gSong.markVisibleTablesForFileSave();
		for (tableDestKey in getSong().visibleNoteTables){
			var tableDest = getSong().visibleNoteTables[tableDestKey];
			if (tblSource != tableDest){
				//console.log("src:"+tblSource+", dest:"+tableDest);
				exportPlayedNotesToOtherTable(tblSource, tableDest);
			}
		}
	}

	function exportPlayedNotesToOtherTable(tblSource, tblDest){
	  var noteArr = gSong.getTableArrInCurrentSection(tblSource);
	  for (key in noteArr){
	      var noteCell = noteArr[key];
	      //console.log("exportPlayedNotesToOtherTable "+noteCell.midinum+","+noteCell.row);
	      var jtd = showMidiNotesInTable(tblDest, noteCell.midinum, noteCell.row);
	      //colorNote(jtd);



	      colorSingleNotes(jtd, noteCell.colorClass, noteCell.styleNum, false);
	  }
	}



  function turnOnKeep(){
      $("#idKeep").prop("checked", true);
  }

  function hideNoteClickedCaption(){
     $(".lblNoteClickedCaption").hide();
  }

  function setNoteClickedCaption(cell, theColorClass, styleNum){
      var caption = "";
      if (cell.attr('midinum')){
          $(".lblNoteClickedCaption").show();
		  var celltable = cell.attr('celltable');
		  if (celltable){
			  celltable = celltable.substring("lbl".length);
		  }
          caption = " "
                   +cell.attr('noteName')+'&nbsp;&nbsp;&nbsp;<small>'+celltable+'</small>['
	                 +(parseInt(cell.attr('cellrow'))+1)+','
	                 +cell.attr('cellcol')+']&nbsp;<small>midi:</small>'
	                 +cell.attr('midinum')
					 +'&nbsp;<small>'+styleNumToCaption(styleNum)+':'+theColorClass+'</small>' ;
	    }
      $(".lblNoteClickedCaption").html(caption);
   }

  	function getBeatNumber(){
		return $("#lblCurrentBeat").text();
	}

	function doingAutomaticColor(){
		return $("#cbAutomaticColor").prop("checked");  //automaticColorScheme
	}

	function turnOffHiding(){
	    var hideNamedNotes = $("#cbHideNamedNotes").prop("checked");
	    var hideTinyNotes = $("#cbHideTinyNotes").prop("checked");
	    var hideSingleNotes = $("#cbHideSingleNotes").prop("checked");
	    var hideFingering = $("#cbHideFingering").prop("checked");
	    $("#cbHideNamedNotes").prop("checked", false);
	    $("#cbHideTinyNotes").prop("checked", false);
	    $("#cbHideSingleNotes").prop("checked", false);
	    $("#cbHideFingering").prop("checked", false);
	    $("#lblHideWarning").hide();
	    if (hideNamedNotes || hideTinyNotes || hideSingleNotes || hideFingering){
	        clearAll();
	        replay();
	    }
  	}

	function updateMemoryModelPreFileSave(){
	    gSong.markVisibleTablesForFileSave();
	    gSong.removeUnusedTablesFromMemoryModel();
	    getBPM();
	    gSong.songName = $("#txtFilename").val();  //TODO: move this to a more obvious function.
		gSong.userColors = gUserColorDict.dict;
		gSong.theme = $('#selThemes').val();
		var theUSERTuning = findTuningForID("USER");
		if (theUSERTuning){
			gSong.userInstrumentTuning = theUSERTuning;  //This is just persistence.  The allTunings.tunings with id="USER" is the live object that is consulted for building noteTables at runtime.
		}
	}

	function downloadBackupThenClearGraveyard(){
		downloadPlayedNotes();
		gSong.graveyard.clear();
		showMessages(gSong.graveyard.buildNoteTable());
	}

	//Use this function to skip saving the ColorDics, because they get generated anyway.
	// Ultimately, only user-customized dicts should be saved, but right now it is doing all the default runtime generated dicts, bloating the file.
	function skipColorDictsReplacer(key, value){
		console.log("key: "+key);
		if (key === 'userColors' || key === 'colorDicts') {
			return undefined;
		}
		return value;
	}

    // file save / save file / saveFile event
	function downloadPlayedNotes(){
	    updateMemoryModelPreFileSave();
	    //var text = JSON.stringify(getSong(), null, 2); // Create element. (with 2 spaces indentation)
	    var text = JSON.stringify(getSong(), skipColorDictsReplacer, 2); // Create element. (with 2 spaces indentation)
	    //console.log("saved file:\r\n"+text);
		var a = document.createElement('a'); // Attach href attribute with value of your file.
	    //a.setAttribute("href", "data:application/xml;charset=utf-8," + text);
	    var fname = "";
	    fname = $("#txtFilename").val().trim();
	    if (fname==""){
	        fname = "untitled";
	    }

		const blob = new Blob([text], {type: "application/json"});
		console.log("saved Blob:\r\n"+blob);
		const url = URL.createObjectURL(blob);
		a.setAttribute("href", url)
	    a.setAttribute("download", fname+".json");   // HTML5 property, to force browser to download it.
	    a.click();
	    hideAllMenuDivs();
	}

    // file open / open file / openFile event
	function setupOpenFile(){
	  	var fileInput = document.getElementById('fileInput');
		fileInput.addEventListener('change', function(e) {  //click works, but is too jumpy. change doesn't work when you apply same file.
		    var file = fileInput.files[0];
			var textType = /json.*/;
			if (file.type.match(textType)) {
				var reader = new FileReader();
				reader.onload = function(e) {
					var str = JSON.stringify(reader.result, null, 2); // spacing level = 2
					openSong(reader.result);
				}
				hideAllMenuDivs();
				reader.readAsText(file);
			} else {
				console.log("File not supported!"+file.name);
			}
        });
	}

	function openSong(str){
		var numFoundBeforeFileLoad = showTuningsForTablesInFile();
		if (numFoundBeforeFileLoad==0){
		  hideAllTunings();
		}
		var jsonObj = JSON.parse(str);
		Object.assign(gSong, jsonObj)

		if (gSong.userInstrumentTuning){
			var theUSERTuning = findTuningForID("USER");
			if (theUSERTuning){
				hideAllTunings();
				Object.assign(theUSERTuning, gSong.userInstrumentTuning);  //the version in the song model is just used for persistence. allTunings.tunings array keeps the USER tuning that is used at runtime.
			}
		}

		//Copy gSong.tunings into allTunings.tunings
		if (gSong.tunings && Array.isArray(gSong.tunings)) {
			var duplicateBaseIDs = [];
			for (var i = 0; i < gSong.tunings.length; i++) {
				var songTuning = gSong.tunings[i];
				var exists = allTunings.tunings.some(function(tuning) {
					return tuning.baseID === songTuning.baseID;
				});
				if (exists) {
					duplicateBaseIDs.push(songTuning.baseID);
					continue;
				}
				
				var cloned = JSON.parse(JSON.stringify(songTuning));  // Deep clone 
				allTunings.tunings.push(cloned);
			}
			if (duplicateBaseIDs.length > 0) {
				alert(
					"Tuning(s) with baseID(s) '" +
					duplicateBaseIDs.join("', '") +
					"' already exist in allTunings. Skipping."
				);
			}
		}

		var frs = [];
		for (var k in jsonObj.sections){
			var section = jsonObj.sections[k];
			var replacementSection = gSong.constructSection();
			section = Object.assign(replacementSection, section);
			frs.push(section);
		}
		jsonObj.sections = frs;
		if (!gSong.isEmpty(gSong.getCurrentSection())){

			var yes = $("#cbAppendSections").prop("checked");
			if (!yes){
				gSong.removeAllSections();
			}
		}
		gSong.addSections(jsonObj);
		gSong.graveyard = makeGraveyard(gSong.graveyard);

		var userTheme = gSong.userTheme;
		if (userTheme){
			userTheme["id"] = "USER";
			getThemes()["USER"] = userTheme;
			gSong.theme = "USER";
		}
		rebuildThemesDropdown();

		

		updateAfterOpenSong();
	}
	function updateAfterOpenSong(){
		hideGraveyard();
		installDefaultColorDicts();

		$('#selThemes').val(gSong.theme).change();
		$("#txtFilename").val(gSong.songName).change();
		$("#cbPresentationMode").prop("checked", !!gSong.presentationMode).change();

		setBPM(gSong.defaultBPM);

		applyStylesheetsTo_gUserColorDict();
		buildColorDicts();


		var tuningsShowing = showTuningsForTablesInFile();
		if (tuningsShowing == 0){
			console.log("showDefaultTuning because file load found none");
			showDefaultTuning();
		}

		replay();
		sectionChanged();
	}

	function installDefaultColorDicts(){
		gSong.colorDicts["All-Clear"] = gAllClear;
		gSong.colorDicts["CycleOfColors"] = gDefault_CycleOfColors;
		gSong.colorDicts["Roles"] = gUserColorDictRolesDefault;
		gSong.colorDicts["Fingerings"] = gUserColorDictFingeringsDefault;
		gSong.colorDicts["Default"] = gUserColorDictOEM;
	}


	function loadSong(songName){
		$.get( "songs/"+songName, function( data ) {  //jQuery automatically calls something like JSON.parse and turns the result into a real javascript Object.
			if (!gSong.isEmpty(gSong.getCurrentSection())){
				var yes = confirm("Keep previous Song Sections? ( 'Cancel' deletes !! Otherwise, 'OK' adds new Song Sections at end of current Song Sections.)");
				if (!yes){
					gSong.removeAllSections();
				}
			}
			openSong(JSON.stringify(data));
		});
	}

	function songLibrary(){
		var divSongList = $('#divSongList');
		if (divSongList.is(":visible") && divSongList.html().trim().length > 0){
			divSongList.hide();
		} else {
			$.get( "songs/song-list.json", function(data){
				var result = "";
				for (var k in data.songs){
						var song = data.songs[k];
						result = result + "<a href='javascript:loadSong(\""+song+"\")'>"+song+"</a><br />";
				}
				$('#divSongList').html(result).show();
			});
		}
	}

	function installAllTuningsTables(){
		var count = 0;
	    for (i in allTunings.tunings){
			var div = buildNoteTable(allTunings.tunings[i]);
			if (div){
		        $('#tabledest')
				    .append(div)
				    .on("click", "td", function() { // This function will execute when any td inside #container is clicked
					    var noteRole = $(this).attr('noteRole'); 
						$("input[name=rbColor][value="+noteRole+"]")
							.attr('checked', 'checked');
							//this div has a ColorDict generated by buildColorDicts 
							// and then we click on the TDs in there, 
							// and the role has been stored in the td attr "noteRole"
						turnOffAutoColorCheckbox();	
					});
				count++;
			}
	    }
		if (count==0){
			var warning = $("<div class='warningMessage'>");
			warning.html("No tunings chosen: click the Tunings button.");
			$('#tabledest').append(warning);
		}
		buildColorDicts();
	}

	function resinstallAllTuningsTables(){
	        var target = $("#tabledest");
	        target.empty();
	        installAllTuningsTables();
	        installTDNoteClick();
			installBtnHamburgerClicks();
	        clearAll();
	        resetNoteNames();
	        showhideTunings();
	}

	function installTDNoteClick(){
	    $('td.note').off('click').click(function() {
	        colorNote($(this));
	        event.stopPropagation();
	    });
	}

	function installRBColorChangeEvents(){
		$( 'input[name="rbColor"]:radio' ).change(function() {
			if ("noteKeep" === $(this).val()){
			} else if ("noteDropper" === $(this).val()){
				$("td.note").css({"cursor": "zoom-in"});
			} else {
				$("td.note").css({"cursor": "pointer"});
				turnOffHiding();
			}
		});
		$( 'input[name="rbColor"]' ).click(function() {
			$('input[name="rbColor"]').css({"box-shadow": "none"});
			$("td.note").css({"cursor": "auto"});
		});
	}


  function addBeat(){
          clearHighlights();
          var jLblCurrentBeat = $("#lblCurrentBeat");
	        var sBeats = $("#txtBeatsPer").val();
	        if (sBeats == ""){
	            $("#txtBeatsPer").val("1");
	            sBeats = $("#txtBeatsPer").val();
	            jLblCurrentBeat.text("1");
	            $("#lblBeat").html("1");
				$("#lblBeats").html(sBeats);
	            return;
	        }
	        var sCurrBeat = jLblCurrentBeat.text();
	        var currBeat = parseInt(sCurrBeat);
	        var beats = parseInt(sBeats);
	        if (currBeat == beats){
	                beats++;
	                currBeat++;
	                $("#txtBeatsPer").val(beats);
					$("#lblBeats").html(beats);
	                jLblCurrentBeat.text(currBeat);
	                $("#lblBeat").html(currBeat);
	        } else if (currBeat < beats) {
	                beats++;
	                $("#txtBeatsPer").val(beats);
					$("#lblBeats").html(beats);
	        }
			getCurrentSection().beats = beats;
			$('#lblBeats').html(beats);
			showBeats();
  }

	// see also: song.js :: cycleThruKeysAllSections()
	function cycleThruKeys(amount){
		var curr = toInt(getCurrentSection().rootID, 0);
		curr=(12+curr + amount) % 12;
		getCurrentSection().rootID = curr;
		$("#dropDownRoot").val(getCurrentSection().rootID);
		resetNoteNames();
		clearRecordedNotes();//for some reason this clears highlights correctly, and used to be in updateSectionsStatus, but didn't belong there.
		updateSectionsStatus();
	}

	function leaveFullscreen(){
		var wasVisible =  $('.container').is(':visible');
		$('.container').show();
		$("#tabledestTopPad").hide();
		$("#divESCAPE").hide();
		return !wasVisible;
	}
	function enterFullscreen(showESCButton){
		$('.container').hide();
		$("#tabledestTopPad").show();
		if (showESCButton){ // undefined ==> false
			$("#divESCAPE").show();
		}
	}
	
	function toggleFullscreen(){
		var wasVisible =  $('.container').is(':visible');  //container holds the menu buttons, so NOT fullscreen when visible.
		$('.container').toggle();
		if (wasVisible){
			gSong.captionsRowShowing = $('.captionRow').is(":visible");
			$('.captionRow').hide();
			$("#tabledestTopPad").show();
		} else {
			if (gSong.captionsRowShowing){
				$('.captionRow').show();
			} else {
				$('.captionRow').hide();
			}
			$("#tabledestTopPad").hide();
			$("#divESCAPE").hide();
		}
	}
	function toggleTransport(){
		//var wasVisible =  $('.transport').is(':visible');
		$('#transport').toggle();
	}
	function toggleCaption(){
		$('#topControlsCaptions').toggle();
	}
	function toggleInstrumentCaptionRow(){
		$('.captionRow').toggle();
	}

	
	

	function transpose(amount){
		cycleThruKeys(amount);
		var namedNoteName = gSong.moveNamedNotes(amount);

		//fullRepaint();//Don't do this, it is a bit slow because it rebuilds.
		clearAll();
		replay();
		showBeats();

		highlightOneNote(namedNoteName);
	}

	function transposeSong(amount){
		gSong.cycleThruKeysAllSections(amount);
		var namedNoteName = gSong.moveNamedNotesAllSections(amount);
		fullRepaint();
		/*clearAll();
		replay();
		showBeats();

		highlightOneNote(namedNoteName);
		*/
	}

	function transposeSongKeys(amount){
		gSong.cycleThruKeysAllSections(amount);
		fullRepaint();
		showBeats();
	}

		function printTablesStats(noteTables){
			var result = "";
			var B = "<br />";
			for (key in noteTables){
				var tableArr = noteTables[key];
				result = result + B + key + ":" + tableArr.length;
			}
			return result;
		}

		function printSections(){
			var sections = getSections();
			var B = "<br />" ;
			var result = "<table border='1' cellspacing='0'><tr><th>ID</th><th>beats</th><th>KEY</th><th>&sharp;/&flat;</th><th>Caption</th><th>Details</th>";
			var namedNotes, specialNotes;
			for (idx in sections){
				var section = sections[idx];
				namedNotes = (Object.keys(section.namedNotes).length>0) ? "namedNotes: "+JSON.stringify(Object.keys(section.namedNotes)) : "";
				specialNotes = (Object.keys(section.noteTables).length>0) ? "<br />SpecialNotes: "+printTablesStats(section.noteTables) : "";
				var SEP = "</td><td>";
				debugger
				result = result+"<tr><td>"
				       +"<a href=\"javascript:linkToSection('"+idx+"');\">"+(toInt(idx,0)+1)+"</a>"+SEP
					   +section.beats+SEP
					   +"<B style='font-size: 130%;'>"+noteIDToNoteName(section.rootID) +(section.rootIDLead!=-1?"/"+noteIDToNoteName(section.rootIDLead):"")+"</B>"+SEP
				       +( section.sharps ? " &sharp; " : " &flat; " )+SEP
					   +"<b style='font-size: 130%;'>"+section.caption+"</b>"+SEP
					   +namedNotes
					   +specialNotes
					   "</td></tr>";
			}
			return result+"</table>";
		}

		function linkToSection(idx){
			gSong.gotoSection(idx);
			hideCmdLine();
		}

		function rangeNamedNoteSlide(element_id, value) {  //called when someone drags the slider--fires javascript onChange from html.
	        //console.log("rangeSlide:"+element_id+" value: "+value);
			setNamedNoteOpacity_inner(element_id, value);
	    }

		function setNamedNoteOpacity_inner(element_id, newValue){
			getSong().namedNoteOpacity = newValue;
			//console.log("setNamedNoteOpacity_inner element_id:"+element_id+" value: "+newValue);
			clearAll();
		    replay();
		    updateSectionsStatus();
		}

		function getNamedNoteOpacity(){
			return $("#rangeNamedNoteOpacity").attr("value");
		}

		function setNamedNoteOpacity(newValue){
			$("#rangeNamedNoteOpacity").attr("value", (newValue));
			setNamedNoteOpacity_inner(null, newValue);
		}

		//======== SingleNote opacity ==========

		function getSingleNoteOpacity(){
			return $("#rangeSingleNoteOpacity").attr("value");
		}

		function setSingleNoteOpacity(newValue){
			$("#rangeSingleNoteOpacity").attr("value", (newValue));
			setSingleNoteOpacity_inner(null, newValue);
		}

		function setSingleNoteOpacity_inner(element_id, newValue){
			getSong().singleNoteOpacity = newValue;
			clearAll();
		    replay();
		    updateSectionsStatus();
		}

		function rangeSingleNoteOpacitySlide(element_id, value) {
			setSingleNoteOpacity_inner(element_id, value);
	    }

		//======== TinyNote opacity ==========

		function getTinyNoteOpacity(){
			return $("#rangeTinyNoteOpacity").attr("value");
		}

		function setTinyNoteOpacity(newValue){
			$("#rangeTinyNoteOpacity").attr("value", (newValue));
			setTinyNoteOpacity_inner(null, newValue);
		}

		function setTinyNoteOpacity_inner(element_id, newValue){
			getSong().tinyNoteOpacity = newValue;
			clearAll();
			replay();
			updateSectionsStatus();
		}

		function rangeTinyNoteOpacitySlide(element_id, value) {
			setTinyNoteOpacity_inner(element_id, value);
		}

	//==============  Other functions that set CSS vars but not in Themes (or themeFunctions.js) =====================


	//This is a Closure state machine
	const cycleThruNutWidths = (() => {
		let gNutSizeState = -1; 
		const arr = ["0", "30px", "60px", "100px", "140px", "220px", "340px", "800px"];
		return function(direction) {
			let newValue = "200px";
			let show = true;
			if (gNutSizeState === -1) {
				gNutSizeState = arr.length - 1;
			}
			gNutSizeState = (gNutSizeState + 1) % arr.length;
			if (gNutSizeState === 0) {
				newValue = "0";
				show = false;
				$('.nut').hide();
			} else {
				newValue = arr[gNutSizeState];
			}
			setOneCssVar("--nut-width", newValue);
			if (show) $('.nut').show();
		};
	})();



	//=============== Misc functions under development  ===========================================

	function updateFontLabel(){
			$('#lblUIFontSize').html(""+gFontSize).show();
			$('#lblCellFontSize').html(""+gNoteFontSize).show();
	}




	//var gLastWhiteBackgroundColor = null;
	//var gLastBlackBackgroundColor = null;
	function showAllNoteNames(show){
		if (show){
			var LastBlackBackgroundColor = $('.noteBlackKey').css("background-color");
			var LastWhiteBackgroundColor  = $('.noteWhiteKey').css("background-color");
			var hexbb = convertRGB_to_HEX(LastBlackBackgroundColor);
			var hexww = convertRGB_to_HEX(LastWhiteBackgroundColor);
			var bw = false; //false is cooler. //force choice of Black/White color for all background colors.  mid-tone colors don't work so well.
			var fontblack = invertColor(hexbb, bw);
			var fontwhite = invertColor(hexww, bw);
			$('.noteWhiteKey').css({color: fontwhite});
			$('.noteBlackKey').css({color: fontblack});
		} else {
			//if (gLastBlackBackgroundColor && gLastWhiteBackgroundColor){
			//		$('.noteWhiteKey').css({color: "transparent"});   //gLastWhiteBackgroundColor});
			//		$('.noteBlackKey').css({color: "transparent"});   //gLastBlackBackgroundColor});
			//		console.log("gLastBlackBackgroundColor:"+gLastBlackBackgroundColor);
			//} else {
			$('.noteWhiteKey').css({color: "transparent"}); //this must sync with .noteWhiteKey's default background color so letters disappear.
			$('.noteBlackKey').css({color: "transparent"});  //ditto
			//}
			//alert("else "+$('.noteWhiteKey').css("color"));

		}
	}


	function automateDisplay(){

	}

	function displayOptionsToControls(options){

		if (gSong.presentationMode){
			var sizesObj = options.NoteDisplaySizes;
		 	$("#dropDownCellWidth").val(sizesObj.width);
		 	$("#dropDownCellHeight").val(sizesObj.height);	 // e.g. {"width": 120,"height": 60};
			if (sizesObj.NoteFontSize){
				setNoteFontSize(sizesObj.NoteFontSize);
			}
		}

		if (options.showAllNoteNames){
			$("#cbShowAllNoteNames").prop("checked", true);
			$('#btnShowAllNoteNames').addClass("BtnPunchedIn").removeClass("BtnPunchedOut");
		} else {
			$("#cbShowAllNoteNames").prop("checked", false);
			$('#btnShowAllNoteNames').addClass("BtnPunchedOut").removeClass("BtnPunchedIn");
		}
		showAllNoteNames(options.showAllNoteNames);

		$("#cbShowCellNotes").prop("checked", options.showCellNotes);
		if (options.showCellNotes){
			$("#cbCenterForRightFunction").prop("checked", options.useCenterForRightFunction);  //otherwise unchecked.
		} else {
			$("#cbCenterForRightFunction").prop("checked", false);
		}

		if (options.cellIsFunction){
			$('input[name=rbnFunctionNotename][value=showFunction]').prop('checked', true);
		} else {
			$('input[name=rbnFunctionNotename][value=showNotename]').prop('checked', true);
		}

	    $("#cbShowSubscriptFunctions").prop("checked", options.showSubscriptFunctions);
	    $("#cbMidiNum").prop("checked", options.showMidiNum);


	 	$("#cbNaturalFretWidths").prop("checked", options.naturalFretWidths);

		$("#cbShowAllNoteNames").prop("checked", options.showAllNoteNames);
		$("#cbHideNamedNotes").prop("checked", options.hideNamedNotes);
	    $("#cbHideTinyNotes").prop("checked", options.hideTinyNotes);
	    $("#cbHideSingleNotes").prop("checked", options.hideSingleNotes);
	    $("#cbHideFingering").prop("checked", options.hideFingering);

		$("#lblHideWarning").hide();

		setNamedNoteOpacity(options.namedNoteOpacity);
		setSingleNoteOpacity(options.singleNoteOpacity);
		setTinyNoteOpacity(options.tinyNoteOpacity);

		$('#textareaFunctionSymbols').val(options.dropDownFunctionSymbols.value).change();


		var currentColorDict = options.currentColorDict;
		if (currentColorDict){
			gSong.currentColorDict = currentColorDict;
			chuseStylesheet(currentColorDict);
		}

		$("#cbAutomaticColor").prop("checked", options.autoColor);

		//ignore #cbPresentationMode because it is Song-scope, not Section-scope.
		$("#selNaturaFontScaling").val(options.naturalFontScaling);
		$("#selNoteFont").val(options.noteFont);
		$("#selLeftSubscriptFontSize").val(options.leftSubscriptFontSize);
		$("#selRightSubscriptFontSize").val(options.rightSubscriptFontSize);
		$("#selMidiFontSize").val(options.midiFontSize);
		$("#selFingeringFontSize").val(options.fingeringFontSize);
		$("#selFingeringPosition").val(options.fingeringPosition);
		$("#selTinyNoteFontSize").val(options.tinyNoteFontSize);
		$("#selTinyNoteMaxHeight").val(options.tinyNoteMaxHeight);
	}

	function controlsToDisplayOptions(){
		var options = {};
		options.autoColor = $("#cbAutomaticColor").prop("checked");
		options.showCellNotes = $("#cbShowCellNotes").prop("checked");
	    options.showSubscriptFunctions = $("#cbShowSubscriptFunctions").prop("checked");
	    options.cellIsFunction = ($('input[name="rbnFunctionNotename"]:checked').val() == "showFunction");
	    options.showMidiNum = $("#cbMidiNum").prop("checked");
		options.useCenterForRightFunction = $("#cbCenterForRightFunction").prop("checked");
		options.naturalFretWidths = $("#cbNaturalFretWidths").prop("checked");

		options.hideNamedNotes = $("#cbHideNamedNotes").prop("checked");
		options.hideTinyNotes = $("#cbHideTinyNotes").prop("checked");
		options.hideSingleNotes = $("#cbHideSingleNotes").prop("checked");
		options.hideFingering = $("#cbHideFingering").prop("checked");

		options.showAllNoteNames = $("#cbShowAllNoteNames").prop("checked");

		options.namedNoteOpacity = getNamedNoteOpacity();
		options.singleNoteOpacity = getSingleNoteOpacity();
		options.tinyNoteOpacity = getTinyNoteOpacity();

		options.currentColorDict = gSong.currentColorDict;
		options.NoteDisplaySizes =  {
										"caption": parseInt($("#dropDownCellWidth").val()) + 'x' + parseInt($("#dropDownCellHeight").val()) + ':' + getNoteFontSize(),
			                        	"width":$("#dropDownCellWidth").val(),
										"height":$("#dropDownCellHeight").val(),
										"NoteFontSize":getNoteFontSize()
									};
		options.dropDownFunctionSymbols = {
										"caption":	$("#dropDownFunctionSymbols option:selected").text(),
										"value":  $("#dropDownFunctionSymbols").val()
									};
		options.naturalFontScaling = $("#selNaturaFontScaling").val();
		options.noteFont = $("#selNoteFont").val();
		options.leftSubscriptFontSize = $("#selLeftSubscriptFontSize").val();
		options.rightSubscriptFontSize = $("#selRightSubscriptFontSize").val();
		options.midiFontSize = $("#selMidiFontSize").val();
		options.fingeringFontSize = $("#selFingeringFontSize").val();
		options.fingeringPosition = $("#selFingeringPosition").val();
		options.tinyNoteFontSize = $("#selTinyNoteFontSize").val();
		options.tinyNoteMaxHeight = $("#selTinyNoteMaxHeight").val();
		//Ignore #cbPresentationMode because it really is Song-scope and not per Section.
		
		return options;
	}

	function installBtnHamburgerClicks(){
		$(".showsubcaption").click(function() {
			$(".subcaption").toggle();
		});
		$(".showcolordict").click(function() {
			var $dicts = $(".currentColorDict");
			if (!$dicts.is(":visible")) {
				// If not visible, show them and ensure largeColorDict is removed
				$dicts.removeClass("largeColorDict").toggle();
			} else if (!$dicts.hasClass("largeColorDict")) {
				// If visible and not large, add large
				$dicts.addClass("largeColorDict");
			} else {
				// If visible and large, remove large and hide
				$dicts.removeClass("largeColorDict").hide();
			}
		});
	}

	function transportResize(){
		//if at top, use this: var left = $('#transportLeftPoint').position().left;
		var tHeight = $('#transport').outerHeight()
		var tWidth = $('#transport').outerWidth()
		var wHeight = $(window).height();
		var wWidth = $(window).width();
		var left = (wWidth / 2) - (tWidth / 2);
		var top = (wHeight-tHeight);

		$('#transport').css({"left": left+"px", "top": top+"px"});
	}

	function toggleAutoColorCheckbox(){
		var cbac = $("#cbAutomaticColor");
		cbac.prop("checked", !cbac.prop("checked"));
		$("#cbAutomaticColor").trigger("change");
		resetNoteNames();
	}
	function turnOffAutoColorCheckbox(){
		var cbac = $("#cbAutomaticColor");
		cbac.prop("checked", false);
		$("#cbAutomaticColor").trigger("change");
		resetNoteNames();
	}




	//=============== document.ready event Binding ==========================

	function bindDesktopEvents(){

		$("#btnPalette").click(function() {
			showOneMenu("#palette");
		});
		$("#btnDesktop").click(function() {
		    showOneMenu("#divDesktop");
		});


		$("#btnHelp").click(function() {

		});

		$("#btnHamburger").click(function() {
		   $("#divControls").toggle();
		   hideAllMenuDivs();
		});


		$("#cbPresentationMode").change(function(){
			gSong.presentationMode = this.checked;
		});



		$("#showHideExtraColors").click(function(event) {
			$("#extraColors").toggle();
			if ($("#extraColors").is(":visible")){
				$("#showHideExtraColors")
					.html("Less...")
					.removeClass("BtnPunchedOut")
					.addClass("BtnPunchedIn");
			} else {
				$("#showHideExtraColors")
				    .html("More...")
					.removeClass("BtnPunchedIn")
					.addClass("BtnPunchedOut");
			}
			event.stopPropagation();
		});

		$("#showHideCustomColorEditors").click(function(event) {
			$("#CustomColorEditors").toggle();
			if ($("#CustomColorEditors").is(":visible")){
				$("#showHideCustomColorEditors").html("Customize Less ...");
			} else {
				$("#showHideCustomColorEditors").html("Customize ...");
			}
			event.stopPropagation();
		});

		$("#showHideCustomColorLinks").click(function() {
			$('#divColorDicts').toggle();
		});

		$("#btnSectionControls").click(function() {
		    showOneMenu("#divSectionControls");
		});
		$("#btnFileControls").click(function() {
		    showOneMenu("#divFileControls")
		});
		$("#btnTunings").click(function() {
		    reloadAllTuningsDisplay();
		    showOneMenu("#divTunings");
		});
		$("#btnFillNotes").click(function() {
		    showOneMenu("#divFillNotes");
		});
		$("#btnViewControls").click(function() {
		    showOneMenu("#divViewControls");
		});
		$("#btnThemeControls").click(function() {
		    showOneMenu("#divThemeControls");
		});

		// ======== BEGIN "Quick" Menu: ==========
		function linkButtonToCB(btnSelector, cbSelector){
			var btn = $(btnSelector);
			var cb = $(cbSelector);
			var wasChecked = cb.prop('checked');
			if (wasChecked){
				btn.addClass(   "BtnPunchedOut")
				   .removeClass("BtnPunchedIn");
				cb.prop('checked', false);
			} else {
				btn.addClass(   "BtnPunchedIn")
				   .removeClass("BtnPunchedOut");
				cb.prop('checked', true);
			}
		}
		$("#btnShowAllNoteNames").click(function() {
			linkButtonToCB('#btnShowAllNoteNames', '#cbShowAllNoteNames');
			showAllNoteNames($('#cbShowAllNoteNames').prop('checked'));
		});
		$("#btnRandomLoop").click(function() {
			getSong().randomLoop = ! getSong().randomLoop;
			if (getSong().randomLoop){
				$('#btnRandomLoop').addClass("BtnPunchedIn").removeClass("BtnPunchedOut");
			} else {
				$('#btnRandomLoop').addClass("BtnPunchedOut").removeClass("BtnPunchedIn");
			}
			if (sectionsLooping()){
				restartLoopSections();
			}
		});
		$("#btnNoteV").click(function() {
			checkRB("#rbNotename");
			resetNoteNames();
		});
		$("#btnFuncV").click(function() {
			checkRB("#rbFunction");
			resetNoteNames();
		});
		$("#btnAutoColor,#btnAutoColor2").click(function() {
			toggleAutoColorCheckbox();
		});
		// ========== END "Quick" Menu ==========




		$("#btnToggleTransport").click(function() {
			$('#transport').toggle();
		});
		$("#btnToggleCmdLine").click(function() {
			toggleCmdLine();
		});
		$("#btnToggleQuick").click(function() {
			$('#divQuick').toggle();
		});





		$("#btnClear").click(function() {
		    resetNoteNames();
		    clearAll();
		});
		$("#btnDownload").click(function() {
		    downloadPlayedNotes();
		});
		$("#btnReplay").click(function() {
		    replay();
		});
		$("#btnPrevSection, #btnPrevSection2").click(function() {
		    gSong.gotoPrevSection(false);
		});
		$("#btnNextSection, #btnNextSection2").click(function() {
		    gSong.gotoNextSection(false);
		});
		$("#btnFirstSection").click(function() {
			gSong.firstSection();
			clearAndReplaySection();
		});
		$("#btnLastSection").click(function() {
		    gSong.lastSection();
			clearAndReplaySection();
		});

		$("#btnNewSection").click(function() {
		    var newIndex = $('#dropDownSectionOrder').val();//might include pseudo-value "END".
		    gSong.newSection(newIndex);
		});
		$("#btnDeleteSection").click(function() {
		    gSong.deleteCurrentSection();
		});
		$("#btnAddShallowCloneSection").click(function() {
			var newIndex = $('#dropDownSectionOrder').val();//might include pseudo-value "END".
		    gSong.addShallowCloneSection(newIndex);
		});
		$("#btnAddDeepCloneSection").click(function() {
		    var newIndex = $('#dropDownSectionOrder').val();//might include pseudo-value "END".
		    gSong.addDeepCloneSection(newIndex);
		});
		$('#btnMoveSectionOrder').click(function(){
			var newIndex = $('#dropDownSectionOrder').val();
			if (newIndex == "END"){
				gSong.moveSectionToEND();
			} else {
				gSong.moveSectionTo(newIndex);
			}
			fullRepaint();
		});
		$("#btnLoopSections").click(function() {
		    toggleLoopSections();
		});
		$("#btnLoopBeats").click(function() {
		    toggleLoopBeats();
		});
		$("#btnLoopBeatsTransport").click(function() {
		    toggleLoopBeats();
		});

		$("#cbShowAllNoteNames").click(function() {
			var show = $("#cbShowAllNoteNames").prop("checked");
			if (show){
				$('#btnShowAllNoteNames')
				   .addClass(   "BtnPunchedIn")
				   .removeClass("BtnPunchedOut");
			} else {
				$('#btnShowAllNoteNames')
				   .addClass(   "BtnPunchedOut")
				   .removeClass("BtnPunchedIn");
			}
			showAllNoteNames(show);
		});

		$(".RecordButton").click(function() {
			var btn = $("#btnRecord");
			var recording = btn.attr("recording");
			if (recording === undefined) {
				$(".RecordButton").addClass("ButtonOn");    //.css({"background-color": "red"});
			    $("#btnRecord").attr("recording", "true");
				clearRecordedNotes();
		        showBeats(gSong.getBeat());
			} else if (recording === "false"){
				$(".RecordButton").addClass("ButtonOn");    //.css({"background-color": "red"});
			    $("#btnRecord").attr("recording", "true");
				clearRecordedNotes();
		        showBeats(gSong.getBeat());
			} else if (recording === "true") {
				$(".RecordButton").removeClass("ButtonOn");  //.css({"background-color": "green"});
				   	$("#btnRecord").attr("recording", "false");
			} else {
				$(".RecordButton").removeClass("ButtonOn"); //css({"background-color": "green"});
				   	$("#btnRecord").attr("recording", "false");
			}
		});

		$("#txtBeatsPer" ).on( "change", function() {
		 getCurrentSection().beats = $( this ).val();
		});

		$("#btnPrevBeat").click(function() {
		    gSong.prevBeat();
		    showHighlightsForBeat(gSong.getBeat());
		});
		$("#btnNextBeat").click(function() {
		    gSong.nextBeat();
		});
		$("#btnPrevBeatTransport").click(function() {
		    gSong.prevBeat();
		});
		$("#btnNextBeatTransport").click(function() {
		  	gSong.nextBeat();
		});

		$("#btnInsertFirstBeat").click(function() {
		    gSong.moveBeatsLater();
		});
		$("#btnAddBeat").click(function() {
		    addBeat();
		});
		$("#btnDeleteBeat").click(function() {
			gSong.deleteBeat();
		});

		$("#txtCaption" ).on( "change", function() {
		 var cap = $( this ).val();
		 getCurrentSection().caption = cap;
		 $(".lblSectionCaption").html(cap);

		});
		$("#txtFilename" ).on( "change", function() {
		 $(".lblSongName").html($( this ).val());
		});

		$("#txtBPM" ).on( "change", function() {
		 setBPM($(this).val());  //interestingly, this does NOT cause jQuery to call ".change()" again.
		});

		$("#btnSharps").click(function() {
	        setSectionKeysSharps();
	    });
	    $("#btnFlats").click(function() {
	       setSectionKeysFlats();
	    });

		$("#btnTransposeDown").click(function() {
			 transpose(-1);
	    });
	    $("#btnTransposeUp").click(function() {
			 transpose(1);
	    });
		$("#btnTransposeJumpDown").click(function() {
			 transpose(-5);
	    });
	    $("#btnTransposeJumpUp").click(function() {
			 transpose(5);
	    });

		// CODE-EXAMPLE("SelectWidget", "Root")
	    $('#dropDownRoot').change(function() {
	        getCurrentSection().rootID = $(this).val();
	        fullRepaint();
	        updateSectionsStatus();
	    });
		// END CODE-EXAMPLE("SelectWidget", "Root")
		$('#dropDownRootLead').change(function() {
            getCurrentSection().rootIDLead = $('#dropDownRootLead').val();
            fullRepaint();
	        updateSectionsStatus();
	    });

		$("#btnRowRangeReset").click(function() {
			//$('#textareaRowRange').val(JSON.stringify(noteNamesRowRangeArr));
			fullRepaint();
		});

		$('#dropDownBaseInstrument').change(function() {
			var baseInstrumentID = $(this).val();
			fullRepaint();
			updateSectionsStatus();
		});

		$('#dropDownCellHeight').change(function() {
			fullRepaint();
	    });
		$('#dropDownCellWidth').change(function() {
			fullRepaint();
		});
		$("#cbNaturalFretWidths,#selNaturaFontScaling").change(function(){
			fullRepaint();
		});
		$("#selNoteFont").change(function(){
			setOneCssVar("--td-note-font-family", $("#selNoteFont").val());
			fullRepaint();
		});
		$("#selLeftSubscriptFontSize").change(function(){
			setOneCssVar("--left-subscript-font-size", $("#selLeftSubscriptFontSize").val());
			fullRepaint();
		});
		$("#selRightSubscriptFontSize").change(function(){
			setOneCssVar("--right-subscript-font-size", $("#selRightSubscriptFontSize").val());
			fullRepaint();
		});
		$("#selTinyNoteMaxHeight").change(function(){
			setOneCssVar("--tiny-note-max-height", $("#selTinyNoteMaxHeight").val());
			fullRepaint();
		});
		$("#selTinyNoteFontSize").change(function(){
			setOneCssVar("--tiny-note-font-size", $("#selTinyNoteFontSize").val());
			fullRepaint();
		});


		$("#selMidiFontSize").change(function(){
			setOneCssVar("--midi-font-size", $("#selMidiFontSize").val());
			fullRepaint();
		});
		$("#selFingeringFontSize").change(function(){
			setOneCssVar("--fingering-font-size", $("#selFingeringFontSize").val());
			fullRepaint();
		});
		$("#selFingeringPosition").change(function(){
			setOneCssVar("--fingering-position", $("#selFingeringPosition").val());
			fullRepaint();
		});
		$('#dropDownInstrumentMargins').change(function() {
			//short-circuit and set it now, it is in mem for next time.
			var margin = this.value;
			$('.instrumentBackground').css({"margin-top": margin, "margin-bottom": +margin });
		});

	    $('#selBend').click(function() {
	        $("#rbBend").prop("checked", true);
	    });

		$("#rbFinger0").click(function(){
            checkRB("#idRFinger0");
        });
		$("#rbFinger1").click(function(){
			checkRB("#idRFinger1");
		});
		$("#rbFinger2").click(function(){
			checkRB("#idRFinger2");
		});
		$("#rbFinger3").click(function(){
			checkRB("#idRFinger3");
		});
		$("#rbFinger4").click(function(){
			checkRB("#idRFinger4");
		});
		$("#rbFingerT").click(function(){
			checkRB("#idRFingerT");
		});

		$("#cbAutomaticColor").change(function() {
			if (this.checked) {
				//console.log("cbAutomaticColor was checked--hiding");
				$('#manualColors').hide();
				$('#btnAutoColor,#btnAutoColor2').addClass("BtnPunchedIn").removeClass("BtnPunchedOut");
			} else {
				//console.log("cbAutomaticColor was not checked--showing");
				$('#manualColors').show();
				$('#btnAutoColor,#btnAutoColor2').addClass("BtnPunchedOut").removeClass("BtnPunchedIn");
			}
			fullRepaint();
		});

		$('#cbHideNamedNotes, #cbHideSingleNotes, #cbHideTinyNotes, #cbHideFingering').change(function() {
				var hnchecked = $('#cbHideNamedNotes').prop("checked");
				var hschecked = $('#cbHideSingleNotes').prop("checked");
				var htchecked = $('#cbHideTinyNotes').prop("checked");
				var hfchecked = $('#cbHideFingering').prop("checked");

				if (htchecked || hschecked || hfchecked || hnchecked){
					turnOnKeep();
					$("#lblHideWarning").show();
				} else {
					$("#lblHideWarning").hide();
				}
				clearAll();
				replay();
	    });

		$('#cbShowCellNotes').change(function() {

			if ( ! this.checked ) {
				$("#cbCenterForRightFunction").prop("checked", false);
			}
			resetNoteNames();
	    });
		$('#cbCenterForRightFunction').change(function() {

			if ( this.checked ) {
				$("#cbShowCellNotes").prop("checked", true);
			}
			resetNoteNames();
	    });
	    $('input[type=radio][name=rbnFunctionNotename]').change(function() {
	        resetNoteNames();
	    });

	    $('#cbShowSubscriptFunctions').change(function() {
	        resetNoteNames();
	    });
	    $('#cbMidiNum').change(function() {
	        resetNoteNames();
	    });
		$("#textareaFunctionSymbols" ).on( "change", function() {
			var txtVal = $('#textareaFunctionSymbols').val();
		    try {
				//Since we are allowing the user to put somthing in, let's validate a bit before accepting.
				 gSong.noteNamesFuncArr = JSON.parse(txtVal);
				 if (!gSong.noteNamesFuncArr.length){
					 throw new TypeError("NoteFunction array is empty -- check commas and quotes.");
				 }
				 if (!gSong.noteNamesFuncArr[0]){
					 throw new TypeError("First NoteFunction is empty");
				 }
				 if (!gSong.noteNamesFuncArr[11]){
					 throw new TypeError("Last NoteFunction is empty");
				 }
			 	 gSong.noteNamesFuncArr = txtVal;
			} catch (error) {
				gSong.noteNamesFuncArr = gSong.noteNamesFuncArrDEFAULT;
				alert("Error setting NoteFunction names: "+error);
			}
			fullRepaint();
		});
		// CODE-EXAMPLE("TextAreaWButtonWidget", "FunctionSymbols")
		$("#btnFunctionSymbolsReset").click(function() {
			gSong.noteNamesFuncArr = gSong.noteNamesFuncArrDEFAULT;
			$('#textareaFunctionSymbols').val(JSON.stringify(gSong.noteNamesFuncArr));
			fullRepaint();
		});
		// END-CODE-EXAMPLE("TextAreaWButtonWidget") 
		$('#dropDownFunctionSymbols').change(function() {
            var value = $('#dropDownFunctionSymbols').val();
			gSong.noteNamesFuncArr = JSON.parse(value);  //this one is safe--comes from our built SELECT.
			$('#textareaFunctionSymbols').val(JSON.stringify(gSong.noteNamesFuncArr));
            fullRepaint();
	    });



		$("#btnFillChord").click(function() {
	        fillChord();
	    });

		$("#btnControlsToDisplayOptions, #btnControlsToDisplayOptions2").click(function() {
	        var options = controlsToDisplayOptions();
			getCurrentSection().displayOptions = options;
			INFO("controlsToDisplayOptions: <br>"+JSON.stringify(options, null, 2));
			showHideDisplayOptionsPresent();
	    });
		$("#btnDeleteDisplayOptions, #btnDeleteDisplayOptions2").click(function() {
			delete getCurrentSection().displayOptions;
			showHideDisplayOptionsPresent();
	    });

		$("#btnRecordUserColors").click(function() {
			recordUserColors();
		});
		$("#btnRecordUserColorsFromSection").click(function() {
			recordUserColorsFromSection();
		});
	}

	function bindThemeEvents(){
		//======= themes  =======
		$('#btnTheme').click(function() {
			var newTheme = controlsToTheme();
			theme(newTheme);
			gSong.userTheme = newTheme;
			getThemes()["USER"] = newTheme;
		});
		$('#btnToggleThemeTableResults').click(function() {
			$('#themeTableResults').toggle();
		});
		$('#selThemes').change(function() {
			var id = this.id;
			var val =  this.value;
			var selectedTheme = getThemes()[val];
			theme(selectedTheme);
			themeToControls(getDefaultTheme());  //Not all themes have all values, so reset all the dropdowns with theme "Default" first.
			themeToControls(selectedTheme);
			clearThemeDiffResults();
		});
		$('#warny').click(function(){
			$(this).hide();
		});
		$('#btnShowWarny').click(function(){
			$('#warny').show();
		});
	}

	function bindDataActionHandlers(){
		// Generate code here for all the Event Handlers:

	}

	//=============== document.ready HELPER functions ==========================

	function ChromeFullscreen() {
	  document.documentElement.webkitRequestFullScreen();
	}

	const SCALING_PREFS = "ScalingPrefs";

	function saveScalingPrefs(){
		var scalingPrefs = {
			UIFontSize:   getUIFontSize(),
			NoteFontSize: getNoteFontSize(),
			CellWidth:    $("#dropDownCellWidth").val(),
			CellHeight:  $("#dropDownCellHeight").val()
		};
		localStorage.setItem(SCALING_PREFS, JSON.stringify(scalingPrefs));
		$("#divScalingPrefs").html(JSON.stringify(scalingPrefs));
	}

	function applyScalingPrefs(noSnark){
		var scalingPrefsStr = localStorage.getItem(SCALING_PREFS);
		if (scalingPrefsStr){
			var scalingPrefs = JSON.parse(scalingPrefsStr);
			if (scalingPrefs.UIFontSize){
				setUIFontSize(scalingPrefs.UIFontSize);
				setNoteFontSize(scalingPrefs.NoteFontSize);
				$("#dropDownCellWidth").val(scalingPrefs.CellWidth).change();
				$("#dropDownCellHeight").val(scalingPrefs.CellHeight).change();
				$("#divScalingPrefs").html(JSON.stringify(scalingPrefs));
			}
		} else {
			if (!noSnark){
				$("#divScalingPrefs").html("No ScalingPrefs in browser storage: click [Save Scaling Prefs] first.");
			}
		}
	}

	function clearScalingPrefs(){
		localStorage.removeItem(SCALING_PREFS);
		$("#divScalingPrefs").html("ScalingPrefs: "+JSON.stringify(localStorage.getItem(SCALING_PREFS)));
	}

	/** After calling this, choose a theme either by default or by looking in song you just opened for USER theme. */
	function rebuildThemesDropdown(){
		$('#SelectThemesDest').html(getWidget_SelectThemes());  //must come before bindThemeEvents()
		bindThemeEvents();
		auditThemes();//sends WARN messages, so hide after.
		$('#warny').hide();
		$('#themeTableResults').hide();
	}

	//=============== document.ready ===========================================

	$(document).ready(function() {
		window.onerror = function (message, url, lineNo, colno, error){
			debugger
		    alert('window.onerror: ' + message
			    + '\r\n URL:'+url
				+'\r\n Line Number: ' + lineNo
				+'\r\n Col Number: '+colno
				+'\r\n Stack: '+error.stack
			);
		    return true;
		}

		gSong = makeSong();  //var song global in this file (at top).
		
		gSong.graveyard = makeGraveyard();

		
		installDefaultColorDicts();
		applyStylesheetsTo_gUserColorDict();
		buildColorDicts();
		$('#divColorDicts').hide();
		$("#CustomColorEditors").hide();

	    installAllTuningsTables();
		installBtnHamburgerClicks();
	    setupOpenFile();
		sectionChanged();
	    installTDNoteClick();
		bindDesktopEvents();
		applyScalingPrefs(true);

		rebuildThemesDropdown();
		$('#selThemes').val("Autobahn").change();
		//will get picked up in open file, but here is the default theme,
		//    which isn't "Default", although it should be.
		//$('#selThemes').val("PoolShark").change();

		$('#textareaFunctionSymbols').val(JSON.stringify(gSong.noteNamesFuncArr));

		var currentFilename = $("#txtFilename").val();
	    $(".lblSongName").html(currentFilename);
		getSong().songName = currentFilename;
		$('.topControlsCaptions').show();

	    $('#cbHighlight').prop('checked', false);
		//NOTE: "checked" is done in buildUserColors, so you don't need to check any rb colors here.

		$("#palette").show();
		$('#cbAutomaticColor').prop('checked', true);
		$("#cbAutomaticColor").trigger('change');//will change from checked to not checked and run click().

		$("#dropDownRootColors").val("noteKeep");
	    $("#dropDownChordsColors").val("noteKeep");
	    $("#dropDownScalesColors").val("noteKeep");
      	$("#lblHideWarning").hide();

		showHideDisplayOptionsPresent();  //enables and disables btnDeleteDisplayOptions etc.
 		hideAllMenuDivs();
		$("#divQuick").hide();
		$("#tabledestTopPad").hide();
		$("#CmdMenu").hide();

		updateFontLabel();

		buildUserColors();
		installRBColorChangeEvents();

	    reloadAllTuningsDisplay();
	    showDefaultTuning();//calls showhideTunings and shows S6 if none found.
	    bindFormTuningsEvents();


		$("#btnFlats").click();  //calls resetNoteNames();

		$(document).on('keypress', document_keypress);
		$("#txtCmdLine").on('keypress', txtCmdLine_keypress);
		$(document).on('keyup', document_keyup);

		$( window ).on( "resize", function() {
			transportResize();
		} );
		transportResize();


		/*$('#cbFloatPalette').change(function() {
			if (this.checked){
				dragElement(document.getElementById("palette"));
			} else {
				dontDragElement(document.getElementById("palette"));
			}
		});
		*/
        draggable(document.getElementById('transport'));

		scrollToTop();

	}); //END document ready function
