/*  Copyright (c) 2023, 2024 Laramie Crocker http://LaramieCrocker.com  */
// TableBuilder class: Facade for table-builder.js utilities
import {
	findTuning,
	findTuningForName,
	findTuningForID,
	buildNoteTable,
	getJoniTuning,
	diamondsRow,
	midinumToNoteName,
	rowRangeToNoteNames,
	dumpTuningsToTable,
	generateSelect,
	generateSelectStringDividerHt,
	getTunings,
	showDefaultTuning,
	showHideTunings,
	hideTuning,
	showTuning,
	showHideTuning,
	showTuningsForTablesInFile,
	hideAllTunings,
	bindFormTuningsEvents
} from './table-builder.js';

class TableBuilder {
	static findTuning(oneBaseID) {
		return findTuning(oneBaseID);
	}

	static findTuningForName(tableID) {
		return findTuningForName(tableID);
	}

	static findTuningForID(id) {
		return findTuningForID(id);
	}

	static buildNoteTable(options) {
		return buildNoteTable(options);
	}

	static getJoniTuning(options) {
		return getJoniTuning(options);
	}

	static diamondsRow(options) {
		return diamondsRow(options);
	}

	static midinumToNoteName(midinum) {
		return midinumToNoteName(midinum);
	}

	static rowRangeToNoteNames(rowRange, options) {
		return rowRangeToNoteNames(rowRange, options);
	}

	static dumpTuningsToTable(tuningsInMemoryHash) {
		return dumpTuningsToTable(tuningsInMemoryHash);
	}

	static generateSelect(ID, frets) {
		return generateSelect(ID, frets);
	}

	static generateSelectStringDividerHt(ID, sHeightValue) {
		return generateSelectStringDividerHt(ID, sHeightValue);
	}

	static getTunings(tableNamesArr) {
		return getTunings(tableNamesArr);
	}

	static showDefaultTuning() {
		return showDefaultTuning();
	}

	static showHideTunings() {
		return showHideTunings();
	}

	static hideTuning(tablekey) {
		return hideTuning(tablekey);
	}

	static showTuning(tablekey) {
		return showTuning(tablekey);
	}

	static showHideTuning(show, basekey) {
		return showHideTuning(show, basekey);
	}

	static showTuningsForTablesInFile() {
		return showTuningsForTablesInFile();
	}

	static hideAllTunings() {
		return hideAllTunings();
	}

	static bindFormTuningsEvents() {
		return bindFormTuningsEvents();
	}
}

export { TableBuilder };


