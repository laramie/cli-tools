
export class Note {
    static STYLENUM_NAMED = 0;
    static STYLENUM_TINY = 1;
    static STYLENUM_SINGLE = 2;
    static STYLENUM_MIDIPITCHES = 3;
    static STYLENUM_MIDIPITCHESSINGLE = 4;
    static STYLENUM_BEND = 5;
    static STYLENUM_FINGERING = 6;

    constructor(noteNameOrOther, styleNum) {
        if (typeof noteNameOrOther === 'object' && noteNameOrOther !== null) {
            Object.keys(noteNameOrOther).forEach(key => {
                this[key] = noteNameOrOther[key];
            });
        } else {
            this.noteName = noteNameOrOther;
            this.styleNum = styleNum;
        }
    }
}

export function newNote(noteName, styleNum) {
    return new Note(noteName, styleNum);
}

export function cloneNote(other) {
    return new Note(other);
}
