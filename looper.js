import {
	showBeats
} from './infinite-neck.js';

	var showBeatsIntervalPointer = null;

	const LOOPING_FRAMES_CAPTION        = "LOOPING...";
	const LOOPING_FRAMES_CAPTION_RANDOM = "RANDOM....";
	const NOT_LOOPING_FRAMES_CAPTION    = "LOOP";

	const LOOPING_BEATS_CAPTION         = "LOOPING...";
	const NOT_LOOPING_BEATS_CAPTION     = "LOOP BEATS";

	function clearBeatAndSectionLooping(){
		window.clearTimeout(showBeatsIntervalPointer);
		showBeatsIntervalPointer = null;
		$("#btnLoopSections").html(NOT_LOOPING_FRAMES_CAPTION).removeClass("ButtonOn");    //css({"background": "white"});
		$("#btnLoopBeats").html(NOT_LOOPING_BEATS_CAPTION).removeClass("ButtonOn");      //.css({"background": "white"});
		$("#btnLoopBeatsTransport").removeClass("ButtonOn");      //.css({"background": "white"});
	}

	function startLoopSections(){
		showBPM();
		if (getSong().randomLoop){
			CAPTION = LOOPING_FRAMES_CAPTION_RANDOM;
		} else {
			CAPTION = LOOPING_FRAMES_CAPTION;
		}
		$("#btnLoopSections").html(CAPTION).addClass("ButtonOn");    //.css({"background": "magenta"});
		var millisNextBeat = getMillisForBeatClock();
		showBeatsIntervalPointer = window.setInterval(showBeatsIntervalHandler, millisNextBeat);
	}
	function startLoopBeats(){
		$("#btnLoopBeats").html(LOOPING_BEATS_CAPTION).addClass("ButtonOn");    //.css({"background": "magenta"});
		$("#btnLoopBeatsTransport").addClass("ButtonOn");                       //.css({"background": "magenta"});

		var millisNextBeat = getMillisForBeatClock();
		showBeatsIntervalPointer = window.setInterval(showBeatsIntervalHandler, millisNextBeat);
	}

	function toggleLoopSections(){
		var sectionsLoopingBool = sectionsLooping();
	    if(showBeatsIntervalPointer){
			clearBeatAndSectionLooping();
	    }
		if (!sectionsLoopingBool){
			startLoopSections()
		}
	}

	function restartLoopSections(){
		if (sectionsLooping()){
			clearBeatAndSectionLooping();
			startLoopSections();
		} else {
			startLoopSections();
		}
	}

	function toggleLoopBeats(){
	    var beatsLoopingBool = beatsLooping();
	    if(showBeatsIntervalPointer){
			clearBeatAndSectionLooping();
	    }
		if (!beatsLoopingBool){
			startLoopBeats()
		}
	}
	function sectionsLooping(){
		return (
			$("#btnLoopSections").text() === LOOPING_FRAMES_CAPTION
		) || (
			$("#btnLoopSections").text() === LOOPING_FRAMES_CAPTION_RANDOM
		);
	}
	function beatsLooping(){
		return $("#btnLoopBeats").text() === LOOPING_BEATS_CAPTION;
	}

	function showBeatsIntervalHandler(){
		var beat = getSong().getBeat();
		var beats = getSong().getBeats();
	    if (beat >= beats){
			if (sectionsLooping()){
				getSong().gotoNextSection(true);  //calls showBeats()
			} else {
				getSong().incBeatLoop();
				showBeats();
			}
		} else {
			getSong().incBeatLoop();
			showBeats();
		}
	}
