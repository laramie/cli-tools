import { Logger } from '../../../bin/namespacer/Logger.js';

describe('Logger basic API', () => {
    let logger;
    beforeAll(() => {
        //This one is different.  We DO want noisy logging: it's a test of Logger!
        logger = Logger.getInstance({ level: Logger.DEBUG });
    });

    test('log(message) does not throw', () => {
        expect(() => {
            logger.log('Logger.test.js Test message');
        }).not.toThrow();
    });

    test('logTopic(topic, message) does not throw', () => {
        expect(() => {
            logger.logTopic(Logger.TOPICS.PLAN_INFO, 'Logger.test.js Plan info message');
        }).not.toThrow();
    });

    test('logLevel(level, topic, message) does not throw', () => {
        expect(() => {
            logger.logLevel(Logger.DEBUG, Logger.TOPICS.OUTPUT, 'Logger.test.js Debug output message');
            logger.logLevel(Logger.INFO, Logger.TOPICS.FILE_WRITES, 'Logger.test.js Info file write message');
            logger.logLevel(Logger.ERROR, Logger.TOPICS.OUTPUT, 'Logger.test.js Error output message');
        }).not.toThrow();
    });

    test('waitForFlush() resolves', async () => {
        await expect(logger.waitForFlush()).resolves.toBeUndefined();
    });
});
