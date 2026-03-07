// Logger.test.js - Jest tests for Logger
import { Logger } from './Logger.js';

describe('Logger basic API', () => {
    let logger;
    beforeAll(() => {
        logger = Logger.getInstance({ level: Logger.DEBUG });
    });

    test('log(message) does not throw', () => {
        expect(() => {
            logger.log('Test message');
        }).not.toThrow();
    });

    test('logTopic(topic, message) does not throw', () => {
        expect(() => {
            logger.logTopic(Logger.TOPICS.PLAN_INFO, 'Plan info message');
        }).not.toThrow();
    });

    test('logLevel(level, topic, message) does not throw', () => {
        expect(() => {
            logger.logLevel(Logger.DEBUG, Logger.TOPICS.OUTPUT, 'Debug output message');
            logger.logLevel(Logger.INFO, Logger.TOPICS.FILE_WRITES, 'Info file write message');
            logger.logLevel(Logger.ERROR, Logger.TOPICS.OUTPUT, 'Error output message');
        }).not.toThrow();
    });

    test('waitForFlush() resolves', async () => {
        await expect(logger.waitForFlush()).resolves.toBeUndefined();
    });
});
