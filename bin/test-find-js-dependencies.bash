#!/usr/bin/env bash


testEm() {
    if [ "$#" -eq 0 ]; then
        echo "testEm() :: No files specified.  Exiting."
        exit
    fi

 echo "First running --tests --h"
 echo 
 echo 
  ./bin/find-js-dependencies.js --tests --h

 echo "Now runing tests."
 echo 
 echo 

 ./bin/find-js-dependencies.js --q --sort --lines --suite=functions  $* 
 ./bin/find-js-dependencies.js --q --sort --lines --suite=exports $* 
 ./bin/find-js-dependencies.js --q --sort --lines --suite=exports $* 
 ./bin/find-js-dependencies.js --q --sort --lines --suite=export-functions $* 
 ./bin/find-js-dependencies.js --q --sort --lines --suite=function-lines --q $* 
 ./bin/find-js-dependencies.js --q --sort --lines --suite=function-lines $* 
 ./bin/find-js-dependencies.js --q --sort --lines --suite=functions $* 
 ./bin/find-js-dependencies.js --q --sort --lines --suite=functions-no-exports $* 
 ./bin/find-js-dependencies.js --q --sort --lines --suite=invocation-lines $* 
 ./bin/find-js-dependencies.js --q --sort --lines --suite=invocations $* 
}

#testEm "utils.js"

testEm "userColors.js"

