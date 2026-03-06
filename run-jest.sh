#!/bin/bash

echo "Usage: ./run-jest.sh _tests/jest/namespacer/ANSIColors.test.js"
echo "Or just ./run-jest.sh to run all tests."

cd "$(dirname "$0")"
node --experimental-vm-modules node_modules/.bin/jest "$@"