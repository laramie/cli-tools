#!/usr/bin/env bash

DEBUG_TESTS=0
COLOR_HELP_TESTS=' --color '
########COLOR_HELP_TESTS=''
###FIND_DEPENDENCIES_OPTIONS=' --sort --color   --lines --filenames --short  '
FIND_DEPENDENCIES_OPTIONS=' --sort --color   --lines --filenames --short  --bare --quiet  '
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
    ./bin/find-js-dependencies.js $COLOR_HELP_TESTS --suites
    
    printHeaderOneline "Now running --suitenumbers"
    ./bin/find-js-dependencies.js $COLOR_HELP_TESTS --suitenumbers
    
    printHeaderOneline "Now running --suitenames"
    ./bin/find-js-dependencies.js $COLOR_HELP_TESTS --suitenames
    
    printHeaderOneline "Now running --help"
    ./bin/find-js-dependencies.js $COLOR_HELP_TESTS --help

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
    #./bin/find-js-dependencies.js --suite=function-lines $@ 
    #./bin/find-js-dependencies.js --suite=functions  $@ 
    #./bin/find-js-dependencies.js --suite=functions-no-exports $@ 
    #./bin/find-js-dependencies.js --suite=export-functions $@ 
    #./bin/find-js-dependencies.js --suite=exports $@ 
    set +x
    
    printHeader "Testing invocations" "$FOO"

    if [ "$DEBUG_TESTS" -eq 1 ]; then
    set -x
    fi
    ./bin/find-js-dependencies.js --suite=invocation-lines $@ 
    ./bin/find-js-dependencies.js --suite=invocations $@ 
    ./bin/find-js-dependencies.js --suite=invocations-no-frameworks $@ 
}


if [ "$DEBUG_TESTS" -eq 1 ]; then
  set -x
fi


#testHelpSystem $FIND_DEPENDENCIES_OPTIONS

testEm $FIND_DEPENDENCIES_OPTIONS "$DISK" "song.js"

#testEm $FIND_DEPENDENCIES_OPTIONS "$DISK" "userColors.js"

## this tests everything in the directory:
#  testEm $FIND_DEPENDENCIES_OPTIONS $DISK 



set +x

echo 
 printHeaderOneline " 🛈     Individual command line examples:"
echo     ./bin/find-js-dependencies.js  $FIND_DEPENDENCIES_OPTIONS  --suite=function-lines $@ 
echo     ./bin/find-js-dependencies.js  $FIND_DEPENDENCIES_OPTIONS  --suite=functions  $@ 
echo     ./bin/find-js-dependencies.js  $FIND_DEPENDENCIES_OPTIONS  --suite=functions-no-exports $@ 
echo     ./bin/find-js-dependencies.js  $FIND_DEPENDENCIES_OPTIONS  --suite=export-functions $@ 
echo     ./bin/find-js-dependencies.js  $FIND_DEPENDENCIES_OPTIONS  --suite=exports $@ 
echo 
echo     ./bin/find-js-dependencies.js  $FIND_DEPENDENCIES_OPTIONS  --suite=invocation-lines $@ 
echo     ./bin/find-js-dependencies.js  $FIND_DEPENDENCIES_OPTIONS  --suite=invocations $@ 
echo     ./bin/find-js-dependencies.js  $FIND_DEPENDENCIES_OPTIONS  --suite=invocations-no-frameworks $@ 
echo 
echo 
 printHeaderOneline "👍   Tests complete."
echo 