#!/usr/bin/env bash

DEBUG_TESTS=1
COLOR_HELP_TESTS=' --color '
########COLOR_HELP_TESTS=''


###FIND_DEPENDENCIES_OPTIONS=' --sort --color   --lines --filenames --short  '
#worked 20260303: FIND_DEPENDENCIES_OPTIONS=' --sort --color   --lines --filenames --short  --bare --verbose --dir=data/src '

## worked 20260303 with linenumber printouts using --line --locations: 
FIND_DEPENDENCIES_OPTIONS=' --sort --color  --lines --locations --filenames --short  --bare  --dir=data/src '

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
    ./find-main.js $COLOR_HELP_TESTS --suites
    
    printHeaderOneline "Now running --suitenumbers"
    ./find-main.js $COLOR_HELP_TESTS --suitenumbers
    
    printHeaderOneline "Now running --suitenames"
    ./find-main.js $COLOR_HELP_TESTS --suitenames
    
    printHeaderOneline "Now running --help"
    ./find-main.js $COLOR_HELP_TESTS --help

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
    ./find-main.js --suite=function-lines $@ 
    ./find-main.js --suite=functions  $@ 
    ./find-main.js --suite=functions-no-exports $@ 
    ./find-main.js --suite=export-functions $@ 
    ./find-main.js --suite=exports $@ 
    set +x
    
    printHeader "Testing invocations" "$FOO"

    if [ "$DEBUG_TESTS" -eq 1 ]; then
    set -x
    fi
    ./find-main.js --suite=invocation-lines $@ 
    ./find-main.js --suite=invocations $@ 
    ./find-main.js --suite=invocations-no-frameworks $@ 
}


if [ "$DEBUG_TESTS" -eq 1 ]; then
  set -x
fi


#testHelpSystem $FIND_DEPENDENCIES_OPTIONS

#testEm $FIND_DEPENDENCIES_OPTIONS "$DISK" "song.js"

#testEm $FIND_DEPENDENCIES_OPTIONS "$DISK" "userColors.js"

## this tests everything in the directory:
testEm $FIND_DEPENDENCIES_OPTIONS $DISK 



set +x

echo 
printHeaderOneline " 🛈     Individual command line examples:"

echo     ./find-main.js $COLOR_HELP_TESTS --suites
echo     ./find-main.js $COLOR_HELP_TESTS --suitenumbers
echo     ./find-main.js $COLOR_HELP_TESTS --suitenames
echo     ./find-main.js $COLOR_HELP_TESTS --help
echo 
echo     ./find-main.js  $FIND_DEPENDENCIES_OPTIONS  --suite=function-lines $@ 
echo     ./find-main.js  $FIND_DEPENDENCIES_OPTIONS  --suite=functions  $@ 
echo     ./find-main.js  $FIND_DEPENDENCIES_OPTIONS  --suite=functions-no-exports $@ 
echo     ./find-main.js  $FIND_DEPENDENCIES_OPTIONS  --suite=export-functions $@ 
echo     ./find-main.js  $FIND_DEPENDENCIES_OPTIONS  --suite=exports $@ 
echo 
echo     ./find-main.js  $FIND_DEPENDENCIES_OPTIONS  --suite=invocation-lines $@ 
echo     ./find-main.js  $FIND_DEPENDENCIES_OPTIONS  --suite=invocations $@ 
echo     ./find-main.js  $FIND_DEPENDENCIES_OPTIONS  --suite=invocations-no-frameworks $@ 
echo 
echo 
 printHeaderOneline "👍   Tests complete."
echo 