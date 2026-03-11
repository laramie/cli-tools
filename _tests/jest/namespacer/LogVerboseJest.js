// LogVerboseJest.js
// Centralized verbose logging setup for Jest tests

const INFINITE_NECK_VERBOSE = process.env.INFINITE_NECK_VERBOSE;
const VERBOSE_MODE_INT = parseInt(INFINITE_NECK_VERBOSE, 10);
const VERBOSE_MODE = isNaN(VERBOSE_MODE_INT) ? 0 : VERBOSE_MODE_INT;

function logVerbose(level, msg) {
    if (VERBOSE_MODE === -1) return;
    if (VERBOSE_MODE >= level) console.log(msg);
}

function logVerboseTrue(){
    return (VERBOSE_MODE >= 1);
}

export { logVerbose, logVerboseTrue, INFINITE_NECK_VERBOSE, VERBOSE_MODE, VERBOSE_MODE_INT };
