export class FindOptions {
    constructor() {
        this.quiet = false;
        this.color = false;
        this.bareExpressions = false;
        this.outputFilename = false;
        this.outputLines = false;
        this.outputSummary = false;
        this.shortSummary = false;
        this.outputSourceLocation = false;
        this.outputSortedLines = false;
        this.verbose = false;
        this.debug = false;
        this.configSource = "command-line";
        this.writeConfigFilename = null;
        this.suiteIdx = typeof FindOptions.DEFAULT_SUITE !== 'undefined' ? FindOptions.DEFAULT_SUITE : 0;
        this.extensions = ['.js', '.txt'];
        this.singleFile = null;
        this.configFilename = null;
        this.dir = "";
        this.dirSpecified = false;
        this.datadir = "data";
        this.datadirSpecified = false;
    }
    static DEFAULT_SUITE = -1;
}
