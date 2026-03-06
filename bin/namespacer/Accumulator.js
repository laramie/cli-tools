// Accumulator.js - ES6 Singleton Accumulator for plan logging
import { ANSIColors } from './ANSIColors.js';

let _GID = 1;

class Accumulator {
    constructor() {
        if (Accumulator._instance) {
            return Accumulator._instance;
        }
        this._ID = _GID++;
        this._planAccumulator = [];
        Accumulator._instance = this;
    }

    accumulate(logline) {
        console.log(" ~~~~~~~ Accumulator["+this._ID+"].accumulate ~~~~~~: "+logline);
        this._planAccumulator.push(logline);
        return logline;
    }

    getAccumulatorPrintout(options) {
        return this._planAccumulator.join("\n")
            + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            + "\n" + (options && options.colorANSI 
                     ? options.colorANSI(ANSIColors.Green, options.getTimeStamp ? options.getTimeStamp(true) : "") 
                     : "no-color->no-date")

            + "\n_ID:"+this._ID
            + "\n\n";

            //TODO: the accumulator is barfing on options.colorANSI so we are going to fix colorANSI to look at the env var.
            
    }

    clear() {
        this._planAccumulator = [];
    }

    getAll() {
        return [...this._planAccumulator];
    }

    static getInstance() {
        if (!Accumulator._instance) {
            Accumulator._instance = new Accumulator();
        }
        return Accumulator._instance;
    }
}

export default Accumulator;
