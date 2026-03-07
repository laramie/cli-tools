// Accumulator.js - ES6 Singleton Accumulator for plan logging
import { ANSIColors } from './ANSIColors.js';
import { Logger } from './Logger.js';

let _GID = 1;

export class Accumulator {
    constructor() {
        if (Accumulator._instance) {
            return Accumulator._instance;
        }
        this._ID = _GID++;
        this._planAccumulator = [];
        this.logger = Logger.getInstance();
        Accumulator._instance = this;
    }

    accumulate(logline) {
        this._planAccumulator.push(logline);
        return logline;
    }

    // Minimal logger API wrappers
    log(message) {
        this.logger.log(message);
    }

    logTopic(topic, message) {
        this.logger.logTopic(topic, message);
    }

    logLevel(level, topic, message) {
        this.logger.logLevel(level, topic, message);
    }

    getAccumulatorPrintout(options) {
        return this._planAccumulator.join("\n")
            + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            + "\n" + ANSIColors.green(Accumulator.getTimeStamp(true))
            + "\n_ID:"+this._ID
            + "\n\n";
    }

    clear() {
        this._planAccumulator = [];
    }

    getAll() {
        return [...this._planAccumulator];
    }

    static getTimeStamp(emitSeconds){
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
        const timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes())  +':'+ (emitSeconds ? pad(now.getSeconds()) : "");
        const dateTimeStr = dateStr + ' ' + timeStr;
        return dateTimeStr;  
    }

    static getInstance() {
        if (!Accumulator._instance) {
            Accumulator._instance = new Accumulator();
        }
        return Accumulator._instance;
    }

    // Clean exit: flush logger, then exit
    async exit(code = 0) {
        try {
            await this.logger.waitForFlush();
        } catch (e) {
            // Optionally log or handle flush errors
        }
        process.exit(code);
    }
}

