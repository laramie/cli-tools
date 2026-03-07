// LoggerCaller.js - Example usage of Logger topic filtering
import { Logger } from './Logger.js';

const logger = Logger.getInstance();

// Disable a topic
Logger.disableTopic(Logger.TOPICS.OUTPUT);

// Only enabled topics will be logged
logger.logTopic(Logger.TOPICS.OUTPUT, 'This will NOT be logged');
logger.logTopic(Logger.TOPICS.PLAN_INFO, 'This WILL be logged');

// Re-enable OUTPUT topic and log again
Logger.enableTopic(Logger.TOPICS.OUTPUT);
logger.logTopic(Logger.TOPICS.OUTPUT, 'This will now be logged');
