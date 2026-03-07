#!/usr/bin/env bash

DEBUG_TESTS=0
COLOR_HELP_TESTS=' --color=false '
#COLOR_HELP_TESTS=' --color '
#COLOR_HELP_TESTS=''
########COLOR_HELP_TESTS=''


###FIND_DEPENDENCIES_OPTIONS=' --sort --color   --lines --filenames --short  '
#worked 20260303: FIND_DEPENDENCIES_OPTIONS=' --sort --color   --lines --filenames --short  --bare --verbose --dir=data/src '

## worked 20260303 with linenumber printouts using --line --locations: 
FIND_DEPENDENCIES_OPTIONS=' --color  --quiet --sort --lines --locations --filenames --short  --bare  --dir=data/src '

# worked 20260303 to produce short, minimal stdout noise:
#FIND_DEPENDENCIES_OPTIONS=' --sort --color  --filenames --short --summary verbose --bare  --dir=data/src '


DISK=" --💾 "
CYAN='\033[1;36m'
RESET='\033[0m'
    
printHeader() {
    echo
    echo -e "${CYAN}▛▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▜${RESET}"
    echo -e "${CYAN}▌   ♺     $1${RESET}  "
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


testHelpSystem() {
    set +x
    if [ "$#" -eq 0 ]; then
        echo "testEm() :: No files specified.  Exiting."
        exit
    fi

    printHeaderOneline "Now running --suites" 
    ./FindMain.js $COLOR_HELP_TESTS --suites
    
    printHeaderOneline "Now running --suitenumbers"
    ./FindMain.js $COLOR_HELP_TESTS --suitenumbers
    
    printHeaderOneline "Now running --suitenames"
    ./FindMain.js $COLOR_HELP_TESTS --suitenames
    
    printHeaderOneline "Now running --help"
    ./FindMain.js $COLOR_HELP_TESTS --help

}

testEm() {
    set +x
    if [ "$#" -eq 0 ]; then
        echo "testEm() :: No files specified.  Exiting."
        exit
    fi

    FOO="$@"
    printHeader "Testing functions and exports" "$FOO"
    if [ "$DEBUG_TESTS" -eq 1 ]; then
        set -x
    fi
    ./FindMain.js --suite=function-lines $@ 
    ./FindMain.js --suite=functions  $@ 
    ./FindMain.js --suite=functions-no-exports $@ 
    ./FindMain.js --suite=export-functions $@ 
    ./FindMain.js --suite=exports $@ 
    set +x
    
    printHeader "Testing invocations" "$FOO"

    if [ "$DEBUG_TESTS" -eq 1 ]; then
        set -x
    fi
    ./FindMain.js --suite=invocation-lines $@ 
    ./FindMain.js --suite=invocations $@ 
    ./FindMain.js --suite=invocations-no-frameworks $@ 
}


if [ "$DEBUG_TESTS" -eq 1 ]; then
  set -x
fi


#testHelpSystem $FIND_DEPENDENCIES_OPTIONS

 testEm $FIND_DEPENDENCIES_OPTIONS "$DISK" "song.js"

## testEm $FIND_DEPENDENCIES_OPTIONS "$DISK" "userColors.js"

## this tests everything in the directory:
##testEm $FIND_DEPENDENCIES_OPTIONS $DISK 



set +x

printExamples(){
    echo 
    printHeaderOneline " 🛈     Individual command line examples:"

    echo     ./FindMain.js $COLOR_HELP_TESTS --suites
    echo     ./FindMain.js $COLOR_HELP_TESTS --suitenumbers
    echo     ./FindMain.js $COLOR_HELP_TESTS --suitenames
    echo     ./FindMain.js $COLOR_HELP_TESTS --help
    echo     ./FindMain.js --color=false --help
    echo 
    echo     ./FindMain.js  $FIND_DEPENDENCIES_OPTIONS  --suite=function-lines $@ 
    echo     ./FindMain.js  $FIND_DEPENDENCIES_OPTIONS  --suite=functions  $@ 
    echo     ./FindMain.js  $FIND_DEPENDENCIES_OPTIONS  --suite=functions-no-exports $@ 
    echo     ./FindMain.js  $FIND_DEPENDENCIES_OPTIONS  --suite=export-functions $@ 
    echo     ./FindMain.js  $FIND_DEPENDENCIES_OPTIONS  --suite=exports $@ 
    echo 
    echo     ./FindMain.js  $FIND_DEPENDENCIES_OPTIONS  --suite=invocation-lines $@ 
    echo     ./FindMain.js  $FIND_DEPENDENCIES_OPTIONS  --suite=invocations $@ 
    echo     ./FindMain.js  $FIND_DEPENDENCIES_OPTIONS  --suite=invocations-no-frameworks $@ 
    echo 
    echo 
   
}

printHeaderOneline "👍   Tests complete."
echo 