class Line {
    constructor({ identifier, startIndex, linenum, rawLine, replacedLine = '', namespace = '', regexUsed = null }) {
        this.identifier = identifier;      // The bare identifier matched
        this.startIndex = startIndex;      // Start index of the identifier in the file
        this.linenum = linenum;            // Line number (1-based)
        this.rawLine = rawLine;            // The full line of source code
        this.replacedLine = replacedLine;  // The line after replacement (optional)
        this.namespace = namespace;        // Namespace to prepend (optional)
        this.regexUsed = regexUsed;        // Regex used for matching (optional)
    }
}

const IDENTIFIERS = ["invocationOne", "invocationTwo", "invocationThree"];
const FILEPATH = "./namespacer/data/song.js";

function readSourceFile(filePath){
    return fs.readFileSync(filePath, 'utf8');

}

function main(){
    let content = readSourceFile(FILEPATH);
    createLinesDataStructure(IDENTIFIERS, content);
}

function createLinesDataStructure(identifiers, content){
    const linesArr = content.split('\n');

    const identifierPattern = identifiers.join('|');
    const lineRegex = new RegExp(`^.*\\b(${identifierPattern})\\b\\s*\\(.*$`, 'gm');

    let match;
    const lineObjects = [];
    while ((match = lineRegex.exec(content)) !== null) {
        // Find line number by counting newlines up to match.index
        const upToMatch = content.slice(0, match.index);
        const linenum = upToMatch.split('\n').length;
        const rawLine = linesArr[linenum - 1];
        const identifier = match[1];
        const startIndex = match.index + match[0].indexOf(identifier);

        lineObjects.push(new Line({
            identifier,
            startIndex,
            linenum,
            rawLine,
            regexUsed: lineRegex
        }));
    }
}

const namespaceMap = {
    invocationOne: 'newNamespaceName1',
    invocationTwo: 'newNamespaceName2',
    invocationThree: 'newNamespaceName3'
    // ...etc
};

function generateReplacedLines(lineObjects){
    lineObjects.forEach(lineObj => {
        if (namespaceMap[lineObj.identifier]) {
            // Replace only the first occurrence in the line
            const pattern = new RegExp(`\\b${lineObj.identifier}\\b`);
            lineObj.replacedLine = lineObj.rawLine.replace(
                pattern,
                `${namespaceMap[lineObj.identifier]}.${lineObj.identifier}`
            );
            lineObj.namespace = namespaceMap[lineObj.identifier];
        } else {
            lineObj.replacedLine = lineObj.rawLine;
        }
    });
}



function writeOutReplacedLines(){
    lineObjects.forEach(lineObj => {
        linesArr[lineObj.linenum - 1] = lineObj.replacedLine;
    });
    const newContent = linesArr.join('\n');
    fs.writeFileSync(outputFilePath, newContent, 'utf8');
}

