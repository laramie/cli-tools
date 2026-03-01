#!/usr/bin/env bash

DEBUG_TESTS=1
FIND_DEPENDENCIES_OPTIONS=' --sort --lines --bare '
#FIND_DEPENDENCIES_OPTIONS=' --q --sort --lines --bare'

printHeader() {
    echo 
    echo 
    echo "▛▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▜ "
    echo "▌   💾     $1"     
    echo "▙▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▟ "
    echo 
    echo
}


testEm() {
    set +x
    if [ "$#" -eq 0 ]; then
        echo "testEm() :: No files specified.  Exiting."
        exit
    fi

    printHeader "First running --suites" 
    echo 
    echo 
    ./bin/find-js-dependencies.js --suites
    echo 
    printHeader "Now running --suitenumbers"
    ./bin/find-js-dependencies.js --suitenumbers
    echo 
    printHeader "Now running --suitenames"
    ./bin/find-js-dependencies.js --suitenames
    echo 
    printHeader "Now running --help"
    ./bin/find-js-dependencies.js --help

    

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
testEm $FIND_DEPENDENCIES_OPTIONS "userColors.js"
#testEm $FIND_DEPENDENCIES_OPTIONS "utils.js"
set +x

echo 
 printHeader "Tests complete."
echo 

