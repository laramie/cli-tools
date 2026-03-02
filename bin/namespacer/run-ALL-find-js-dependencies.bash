#!/usr/bin/env bash

COLOR_HELP_TESTS=' --color '
DISK=" --💾 "
CYAN='\033[1;36m'
RESET='\033[0m'
    
printHeader() {
    echo
    echo -e "${CYAN}▛▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▜${RESET}"
    echo -e "${CYAN}▌        $1${RESET}        "  
    echo -e "${CYAN}▌            $2${RESET}  "
    echo -e "${CYAN}▌            $3${RESET}  "
    echo -e "${CYAN}▙▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▟${RESET}"
    echo
    echo
}

printHeaderOneline() {
    echo
    echo -e "${CYAN}▛▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▜${RESET}"
    echo -e "${CYAN}▌        $1${RESET}  "
    echo -e "${CYAN}▙▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▟${RESET}"
    echo
    echo
}



 printHeader "🙏   Generation running..."
 
 set -x
 ###RUN_DEPENDENCIES_OPTS=' --sort --color   --lines --filenames --short  --bare --quiet  '

RUN_DEPENDENCIES_OPTS='  --dir='./data/src/' --suite=functions --quiet --bare --lines  '

./find-js-dependencies.js $RUN_DEPENDENCIES_OPTS  infinite-neck.js > ./data/plans/infinite-neck.js.functions.gen
./find-js-dependencies.js $RUN_DEPENDENCIES_OPTS  song.js > ./data/plans/song.js.functions.gen
./find-js-dependencies.js $RUN_DEPENDENCIES_OPTS  colorFunctions.js > ./data/plans/colorFunctions.js.functions.gen
./find-js-dependencies.js $RUN_DEPENDENCIES_OPTS  notetable.js > ./data/plans/notetable.js.functions.gen
 
 set +x

 printHeaderOneline "👍   Generation complete."
 echo 