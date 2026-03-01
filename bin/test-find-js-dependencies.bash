#!/usr/bin/env bash

DEBUG_TESTS=0
FIND_DEPENDENCIES_OPTIONS=' --sort --lines --bare --color '

printHeader() {
    CYAN='\033[1;36m'
    RESET='\033[0m'
    echo
    echo -e "${CYAN}▛▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▜${RESET}"
    echo -e "${CYAN}▌   💾     $1${RESET}"
    echo -e "${CYAN}▙▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▟${RESET}"
    echo
    echo
}


testHelpSystem() {
    set +x
    if [ "$#" -eq 0 ]; then
        echo "testEm() :: No files specified.  Exiting."
        exit
    fi

    printHeader "First running --suites" 
    ./bin/find-js-dependencies.js --color --suites
    
    printHeader "Now running --suitenumbers"
    ./bin/find-js-dependencies.js --color --suitenumbers
    
    printHeader "Now running --suitenames"
    ./bin/find-js-dependencies.js --color --suitenames
    
    printHeader "Now running --help"
    ./bin/find-js-dependencies.js --color --help

}

testEm() {
    set +x
    if [ "$#" -eq 0 ]; then
        echo "testEm() :: No files specified.  Exiting."
        exit
    fi

    printHeader "Testing functions and exports"
    if [ "$DEBUG_TESTS" -eq 1 ]; then
    set -x
    fi
    ./bin/find-js-dependencies.js --suite=function-lines $@ 
    ./bin/find-js-dependencies.js --suite=functions  $@ 
    ./bin/find-js-dependencies.js --suite=functions-no-exports $@ 
    ./bin/find-js-dependencies.js --suite=export-functions $@ 
    ./bin/find-js-dependencies.js --suite=exports $@ 
    set +x
    
    printHeader "Testing invocations"

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


testHelpSystem $FIND_DEPENDENCIES_OPTIONS

#testEm $FIND_DEPENDENCIES_OPTIONS "userColors.js"

#testEm $FIND_DEPENDENCIES_OPTIONS "utils.js"



set +x

echo 
 printHeader "Tests complete."
echo 

