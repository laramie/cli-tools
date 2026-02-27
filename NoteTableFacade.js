import {
  
} from './infinite-neck.js';
import {
	colorNote,
	buildCellsFromSelector,
	replay,
	showHighlightsForBeat,
	fullRepaint,
	clearAll
} from './notetable.js';

class NoteTableFacade {
	static colorNote(cell) {
		return colorNote(cell);
	}

	static buildCellsFromSelector(selector, noteLetter, sharpflat, noteNum, options) {
		return buildCellsFromSelector(selector, noteLetter, sharpflat, noteNum, options);
	}

	static replay() {
		return replay();
	}

	static showHighlightsForBeat(nBeat) {
		return showHighlightsForBeat(nBeat);
	}

	static fullRepaint() {
		return fullRepaint();
	}

	static clearAll() {
		return clearAll();
	}
}

export { NoteTableFacade };
