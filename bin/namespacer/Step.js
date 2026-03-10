// Implements the Step data model as described in the design doc

export class Step {

    // Log level constants
	static DEBUG = 10;
	static INFO = 20;
	static WARN = 30;
	static ERROR = 40;
	static LEVELS = {
		debug: Step.DEBUG,
		info: Step.INFO,
		warn: Step.WARN,
		error: Step.ERROR
	};
	static levelToInt(level) {
		if (!level) return Step.INFO;
		if (typeof level === 'number') return level;
		return Step.LEVELS[String(level).toLowerCase()] ?? Step.INFO;
	}

	/**
	 * @param {Object} params - Step fields
	 * @param {string} params.stepID - Dotted path identifier
	 * @param {string} params.logline - Human-readable log message
	 * @param {Object} [params.obj={}] - Optional payload object
	 * @param {string} [params.icon] - Optional icon (Emoji getter name)
	 * @param {string} [params.level] - Optional level (debug/info/warn/error)
	 * @param {string} [params.path] - Optional file path for file-related steps
	 */
	constructor({ stepID, logline, obj = {}, icon, level, path } = {}) {
		if (!stepID || typeof stepID !== 'string') {
			throw new Error('Step requires a string stepID');
		}
		if (!logline || typeof logline !== 'string') {
			throw new Error('Step requires a string logline');
		}
		this.stepID = stepID;
		this.logline = logline;
		this.obj = obj || {};
		this.icon = icon || 'BEETLE'; // Default per spec
		this.level = level || 'info'; // Default per spec
		this.path = path || '';
	}
    

	/**
	 * Returns a plain JSON representation
	 */
	toJSON() {
		return {
			stepID: this.stepID,
			logline: this.logline,
			obj: this.obj,
			icon: this.icon,
			level: this.level,
			path: this.path
		};
	}
}