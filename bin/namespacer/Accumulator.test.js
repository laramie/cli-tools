// Accumulator.test.js - Jest tests for Accumulator logger API wrappers
import { Accumulator } from './Accumulator.js';
import { Logger } from './Logger.js';

describe('Accumulator logger API wrappers', () => {
    let acc;
    beforeAll(() => {
        acc = Accumulator.getInstance();
    });

    test('log(message) does not throw', () => {
        expect(() => {
            acc.log('Test message from Accumulator');
        }).not.toThrow();
    });

    test('logTopic(topic, message) does not throw', () => {
        expect(() => {
            acc.logTopic(Logger.TOPICS.PLAN_INFO, 'Plan info message from Accumulator');
        }).not.toThrow();
    });

    test('logLevel(level, topic, message) does not throw', () => {
        expect(() => {
            acc.logLevel(Logger.DEBUG, Logger.TOPICS.OUTPUT, 'Debug output message from Accumulator');
            acc.logLevel(Logger.INFO, Logger.TOPICS.FILE_WRITES, 'Info file write message from Accumulator');
            acc.logLevel(Logger.ERROR, Logger.TOPICS.OUTPUT, 'Error output message from Accumulator');
        }).not.toThrow();
    });

    test('exit() flushes logger and exits (mocked)', async () => {
        // Mock process.exit
        const originalExit = process.exit;
        process.exit = jest.fn();
        await acc.exit(0);
        expect(process.exit).toHaveBeenCalledWith(0);
        process.exit = originalExit;
    });
});
