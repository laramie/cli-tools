// Logger.js - Central logger for namespacer tools (ESM)
import pino from 'pino';

export class Logger {
    // Level constants
    static DEBUG = 'debug';
    static INFO = 'info';
    static WARN = 'warn';
    static ERROR = 'error';
    static FATAL = 'fatal';

    // Topic constants (edit as needed)
    static TOPICS = {
        PLAN_INFO: 'plan-info',
        FILE_WRITES: 'file-writes',
        INTERFACE_GENS: 'interface-gens',
        MASTER_NAMESPACE_MAP: 'master-namespace-map',
        OUTPUT: 'output',
        OUTPUT_REPLACEMENTS: 'output-replacements',
        OUTPUT_NOOP_REPLACEMENTS: 'output-noop-replacements',
        OUTPUT_REPLACEMENTS_LINENUM: 'output-replacements-linenum',
        GENERAL: 'general'
    };

    static _instance;

    constructor(options = {}) {
        if (Logger._instance) return Logger._instance;
        this.logger = pino({ ...options, sync: false });
        Logger._instance = this;
    }

    // log(message)
    log(message) {
        this.logger.info({ topic: Logger.TOPICS.GENERAL }, message);
    }

    // log(topic, message)
    logTopic(topic, message) {
        this.logger.info({ topic }, message);
    }

    // log(level, topic, message)
    logLevel(level, topic, message) {
        if (typeof this.logger[level] === 'function') {
            this.logger[level]({ topic }, message);
        } else {
            this.logger.info({ topic }, message);
        }
    }

    // Wait for flush (blocking)
    async waitForFlush() {
        this.logger.flush();
        return new Promise(resolve => setImmediate(resolve));
    }

    // Singleton accessor
    static getInstance(options = {}) {
        if (!Logger._instance) {
            Logger._instance = new Logger(options);
        }
        return Logger._instance;
    }
}
