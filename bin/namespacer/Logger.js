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


    // Set of enabled topics (default: all enabled)
    static enabledTopics = new Set(Object.values(Logger.TOPICS));
    static _instance;

    // Enable a topic
    static enableTopic(topic) {
        Logger.enabledTopics.add(topic);
    }

    // Disable a topic
    static disableTopic(topic) {
        Logger.enabledTopics.delete(topic);
    }

    // Set enabled topics (replaces all)
    static setEnabledTopics(topicsArray) {
        Logger.enabledTopics = new Set(topicsArray);
    }

    // Check if topic is enabled
    static isTopicEnabled(topic) {
        return Logger.enabledTopics.has(topic);
    }

    constructor(options = {}) {
        if (Logger._instance) return Logger._instance;
        this.logger = pino({ ...options, sync: false });
        Logger._instance = this;
    }

    // log(message)
    log(message) {
        this.logger.info({ topic: Logger.TOPICS.GENERAL }, message);
    }


    // log(topic, message) with topic filtering
    logTopic(topic, message) {
        if (Logger.isTopicEnabled(topic)) {
            this.logger.info({ topic }, message);
        }
    }


    // log(level, topic, message) with topic filtering
    logLevel(level, topic, message) {
        if (Logger.isTopicEnabled(topic)) {
            if (typeof this.logger[level] === 'function') {
                this.logger[level]({ topic }, message);
            } else {
                this.logger.info({ topic }, message);
            }
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

    /**
     * Resets the Logger singleton instance. Useful for test isolation or reconfiguration.
     * Optionally accepts options to reconfigure the logger.
     */
    static resetInstance(options = {}) {
        Logger._instance = null;
        if (Object.keys(options).length > 0) {
            Logger._instance = new Logger(options);
        }
    }
}
