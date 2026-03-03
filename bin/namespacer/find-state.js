export class State {
    #foundBegin = false;
    #foundEnd = false;
    #lines = [];
    #lineSet = new Set();
    filename = "";
    suite = "";
    
    addLine(line, linenum, startIndex, all) {
        if (all || !this.#lineSet.has(line)) {
            //let rawLine = ""; //TODO: have the caller send in the full line.
            //let replacedLine = "";
            this.#lines.push({ line, linenum, startIndex });
            this.#lineSet.add(line);
        }
    }
    printLines(outputOptions) {
        return this.#lines.map(obj =>
            outputOptions.outputSourceLocation
                ? 
                `${obj.linenum.toString().padStart(6, ' ')}\t[${obj.startIndex.toString().padStart(6, ' ')}]:\t${obj.line}`
                : obj.line
        ).join('\n');
    }
    printLinesSorted(outputOptions) {
        // Sort a copy of #lines by line content, do not mutate #lines
        const sorted = [...this.#lines].sort((a, b) => {
            if (a.line < b.line) return -1;
            if (a.line > b.line) return 1;
            return 0;
        });
        return sorted.map(obj =>
            outputOptions.outputSourceLocation
                ? 
                `${obj.linenum.toString().padStart(6, ' ')}\t[${obj.startIndex.toString().padStart(6, ' ')}]:\t${obj.line}`
                : obj.line
        ).join('\n');
    }
    printFilename(){
        return this.filename;
    }
    printSummary(outputOptions){
        return JSON.stringify(this.toJSON(outputOptions), null, 4);
    }

    quantifyFound() {
        return this.#lines.length;
    }
    foundBegin() {
        this.#foundBegin = true;
    }
    foundEnd() {
        this.#foundEnd = true;
    }
    toJSON(outputOptions){
        if (outputOptions.outputSourceLocation){
            return {
                    suite: this.suite,
                    filename: this.filename,
                    quantifyFound: this.#lines.length,
                    lines: this.#lines
            };
        } else {
            if (options.shortSummary){
                return {
                    suite: this.suite,
                    filename: this.filename,
                    quantifyFound: this.#lines.length                    
                }
            } else {
                return {
                    suite: this.suite,
                    filename: this.filename,
                    quantifyFound: this.#lines.length,
                    lines: this.#lines.map(obj => obj.line)
                }
            }
        }
    }

    test(){
        console.log("in State.test() instance method");
    }
    
}

