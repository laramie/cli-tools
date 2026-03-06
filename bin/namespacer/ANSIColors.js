
// Singleton ANSIColor with static API and environment detection
class ANSIColor {
    // Static color codes
    static Reset = '\x1b[0m';
    static Bold = '\x1b[1m';
    static Dim =  '\x1b[2m';
    static Underline = '\x1b[4m';
    static Inverse = '\x1b[7m';
    static Black = '\x1b[30m';
    static Red = '\x1b[31m';
    static Green = '\x1b[32m';
    static Yellow = '\x1b[33m';
    static Blue = '\x1b[34m';
    static Magenta = '\x1b[35m';
    static Cyan = '\x1b[36m';
    static White = '\x1b[37m';
    static BgBlack = '\x1b[40m';
    static BgRed = '\x1b[41m';
    static BgGreen = '\x1b[42m';
    static BgYellow = '\x1b[43m';
    static BgBlue = '\x1b[44m';
    static BgMagenta = '\x1b[45m';
    static BgCyan = '\x1b[46m';
    static BgWhite = '\x1b[47m';
    static BQ = ANSIColor.Magenta + '❝' + ANSIColor.Reset;
    static EQ = ANSIColor.Magenta + '❞' + ANSIColor.Reset;
    static BQ_NOCOLOR = '❝';
    static EQ_NOCOLOR = '❞';

    // Singleton instance
    static #instance = null;

    // Internal state
    #nocolor = true;
    #blame = [];

    constructor() {
        this.#nocolor = !ANSIColor.#checkColorSupport();
    }

    static #getInstance() {
        if (!ANSIColor.#instance) {
            ANSIColor.#instance = new ANSIColor();
        }
        return ANSIColor.#instance;
    }

    // Environment color support detection
    static #checkColorSupport() {
        if (typeof process !== 'undefined' && process.env) {
            if (process.env.FORCE_COLOR !== undefined) {
                return parseInt(process.env.FORCE_COLOR) > 0;
            }
            if (process.env.NO_COLOR !== undefined || process.env.NODE_DISABLE_COLORS !== undefined) {
                return false;
            }
            if (process.stdout && typeof process.stdout.isTTY === 'boolean') {
                return process.stdout.isTTY;
            }
        }
        return false;
    }

    // API: setColor(yes)
    static setColor(yes) {
        const inst = ANSIColor.#getInstance();
        try {
            throw new Error('ANSIColor.setColor called');
        } catch (e) {
            inst.#blame.push(e.stack);
        }
        inst.#nocolor = !yes;
    }

    // API: isColoring()
    static isColoring() {
        return !ANSIColor.#getInstance().#nocolor;
    }

    // API: getBlame()
    static getBlame() {
        return ANSIColor.#getInstance().#blame.join("\n\n");
    }

    // Color methods (camelCase)
    static red(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.Red + m + ANSIColor.Reset;
    }
    static green(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.Green + m + ANSIColor.Reset;
    }
    static yellow(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.Yellow + m + ANSIColor.Reset;
    }
    static blue(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.Blue + m + ANSIColor.Reset;
    }
    static magenta(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.Magenta + m + ANSIColor.Reset;
    }
    static cyan(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.Cyan + m + ANSIColor.Reset;
    }
    static white(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.White + m + ANSIColor.Reset;
    }
    static black(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.Black + m + ANSIColor.Reset;
    }
    // Backgrounds
    static bgBlack(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.BgBlack + m + ANSIColor.Reset;
    }
    static bgRed(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.BgRed + m + ANSIColor.Reset;
    }
    static bgGreen(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.BgGreen + m + ANSIColor.Reset;
    }
    static bgYellow(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.BgYellow + m + ANSIColor.Reset;
    }
    static bgBlue(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.BgBlue + m + ANSIColor.Reset;
    }
    static bgMagenta(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.BgMagenta + m + ANSIColor.Reset;
    }
    static bgCyan(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.BgCyan + m + ANSIColor.Reset;
    }
    static bgWhite(m) {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? m : ANSIColor.BgWhite + m + ANSIColor.Reset;
    }
    // Decorations: open/close and message-wrapping
    static bold(message) {
        const inst = ANSIColor.#getInstance();
        if (typeof message === 'undefined') {
            return inst.#nocolor ? '' : ANSIColor.Bold;
        }
        return inst.#nocolor ? message : ANSIColor.Bold + message + ANSIColor.Reset;
    }
    static dim(message) {
        const inst = ANSIColor.#getInstance();
        if (typeof message === 'undefined') {
            return inst.#nocolor ? '' : ANSIColor.Dim;
        }
        return inst.#nocolor ? message : ANSIColor.Dim + message + ANSIColor.Reset;
    }
    static underline(message) {
        const inst = ANSIColor.#getInstance();
        if (typeof message === 'undefined') {
            return inst.#nocolor ? '' : ANSIColor.Underline;
        }
        return inst.#nocolor ? message : ANSIColor.Underline + message + ANSIColor.Reset;
    }
    static inverse(message) {
        const inst = ANSIColor.#getInstance();
        if (typeof message === 'undefined') {
            return inst.#nocolor ? '' : ANSIColor.Inverse;
        }
        return inst.#nocolor ? message : ANSIColor.Inverse + message + ANSIColor.Reset;
    }
    static reset() {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? '' : ANSIColor.Reset;
    }
    // Special quote accessors
    static bq() {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? ANSIColor.BQ_NOCOLOR : ANSIColor.BQ;
    }
    static eq() {
        const inst = ANSIColor.#getInstance();
        return inst.#nocolor ? ANSIColor.EQ_NOCOLOR : ANSIColor.EQ;
    }
    // For testing
    static testColors() {
        const names = [
            'Black','Red','Green','Yellow','Blue','Magenta','Cyan','White',
            'BgBlack','BgRed','BgGreen','BgYellow','BgBlue','BgMagenta','BgCyan','BgWhite',
            'Bold','Dim','Underline','Inverse'
        ];
        names.forEach(name => {
            if (ANSIColor[name]) {
                console.log(ANSIColor[name] + name + ANSIColor.Reset);
            }
        });
    }
}


export { ANSIColor };

