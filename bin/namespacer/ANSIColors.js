/** Simple class to encapsulate ANSI terminal colors and escape sequences.
 */
export class ANSIColors {
    constructor() {
    }

    //Reset/General';
    static Reset = '\x1b[0m'; 

    //Text Decorations';
    static Bold = '\x1b[1m';
    static Dim =  '\x1b[2m';
    static Underline = '\x1b[4m';
    static Inverse = '\x1b[7m';
    
    //Foreground Colors';
    static Black = '\x1b[30m';
    static Red = '\x1b[31m';
    static Green = '\x1b[32m';
    static Yellow = '\x1b[33m';
    static Blue = '\x1b[34m';
    static Magenta = '\x1b[35m';
    static Cyan = '\x1b[36m';
    static White = '\x1b[37m';
    
    //Background Colors';
    static BgBlack = '\x1b[40m';
    static BgRed = '\x1b[41m';
    static BgGreen = '\x1b[42m';
    static BgYellow = '\x1b[43m';
    static BgBlue = '\x1b[44m';
    static BgMagenta = '\x1b[45m';
    static BgCyan = '\x1b[46m';
    static BgWhite = '\x1b[47m'

    static BQ = ANSIColors.Magenta+'❝'+ANSIColors.Reset;
    static EQ = ANSIColors.Magenta+'❞'+ANSIColors.Reset;


    static testColors(){
        Object.entries(ANSIColors).forEach(([prop, val]) => {
            console.log(val, "   "+prop+"   "+ANSIColors.Reset);
        });
        return Object.entries(ANSIColors).length;
    }

}

function test(){
    ANSIColors.testColors();
}

