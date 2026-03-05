import { readFileSync } from 'fs';

export const ReadSourceStatus = Object.freeze({
    NO_PATH: 'no-path',
    FOUND: 'found',
    NOT_FOUND: 'not-found',
    READ_ERROR: 'read-error'
});

export class SourceFile {
    /**
     * Static method to read a file and return status, error, and contents.
     * @param {string} filePath
     * @returns {{status: string, error: Error|null, contents: string}}
     */
    static read(filePath) {
        const Status = ReadSourceStatus;
        try {
            if (!filePath) {
                return { status: Status.NO_PATH, error: null, contents: "" };
            }
            const data = readFileSync(filePath, 'utf8');
            return { status: Status.FOUND, error: null, contents: data || "" };
        } catch (err) {
            if (err.code === 'ENOENT') {
                return { status: Status.NOT_FOUND, error: err, contents: "" };
            } else {
                return { status: Status.READ_ERROR, error: err, contents: "" };
            }
        }
    }

    /**
     * Instance method to write to a file (not implemented yet).
     */
    write() {
        throw new Error('SourceFile.write() not implemented');
    }
}
