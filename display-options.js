let getSongProvider = function () {
    return null;
};

let controlsToDisplayOptionsProvider = function () {
    return {};
};

export function setDisplayOptionsProviders(providers){
    if (!providers) return;
    if (typeof providers.getSong === 'function') {
        getSongProvider = providers.getSong;
    }
    if (typeof providers.controlsToDisplayOptions === 'function') {
        controlsToDisplayOptionsProvider = providers.controlsToDisplayOptions;
    }
}


export function displayOptionsTable(){
    var optionsPrototype = controlsToDisplayOptionsProvider();
    var res = [];
    res.push("<table border='1' class='tblDisplayOptions'><caption>All Sections with Display Options</caption>");
    var prevDisplayOptions = null;
    var skippedRow = false;

    var rowc = displayOptionsCaptionRow(optionsPrototype);
    res.push("<tr><td style='vertical-align: bottom;'>Section&nbsp;#</td>"+rowc+"</tr>");

    var song = getSongProvider();
    if (!song) {
        return "";
    }
    var sections = song.getSections();
    sections.forEach((section, sectionIdx) => {
        var displayOptions = section.displayOptions;
        if (displayOptions){
            var row = displayOptionsRow(optionsPrototype, displayOptions, sectionIdx, prevDisplayOptions, skippedRow);
            res.push("<tr>"+row+"</tr>");
            prevDisplayOptions = displayOptions;
            skippedRow = false;
        } else {
            skippedRow = true;
        }
    });

    res.push("</table>");
    return res.join("\r\n")
}

function stringify(val){
    if (val){
        var res = JSON.stringify(val);
        var start = 0;
        if (res[0] == '"'){
            start = 1;
        }
        if ( res[res.length-1] == '"' && res[res.length-2] != '\\' && (start>0) ){
            res = res.substring(start, res.length-1);
        }
        return res;
    } else {
        return "";
    }
}

function displayOptionsRow(optionsPrototype, displayOptions, sectionIdx, prevDisplayOptions, skippedRow){
    var res = [];
    var color = "white";
    var topBorder = skippedRow ? " style='border-top: 2px dashed orange;' " : "";
    res.push("<td"+topBorder+">"+(parseInt(sectionIdx)+1)+"</td>");

    for (const [key, val] of Object.entries(optionsPrototype)) {
        var option = displayOptions[key];
        var sval = stringify(option); //could be the string "null" which is OK.
        if (option && option.caption){
            sval = option.caption;
        }
        if (prevDisplayOptions){
            var prevOption = prevDisplayOptions[key];
            var sPrevVal = stringify(prevOption); //could be the string "null" which is OK.
            if (prevOption && prevOption.caption){
                sPrevVal = prevOption.caption;
            }
            if (sval == sPrevVal){
                color = "white";
            } else {
                color = "chartreuse";
            }
        }
        if (option != null){
            sval = sval && sval.length>0 ? sval : "&nbsp;";
            if (sval == "true"){
                sval = "&check;";
            } else if (sval == "false"){
                sval = "";
            }
            res.push("<td style='background-color: "+color+";'>"+sval+"</td>");
        } else {
            res.push("<td style='background-color: darkgray;'>&nbsp;</td>");
        }
    }
    return res.join("\r\n");
}

function displayOptionsCaptionRow(optionsPrototype, displayOptions){
    var res = [];
    for (const [key, val] of Object.entries(optionsPrototype)) {
        res.push("<th class='vertical-header'><span>"+key+"</span></th>");
    }
    return res.join("\r\n");
}
