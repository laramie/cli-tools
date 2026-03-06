// jest.config.js
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  testEnvironment: 'node',
  transform: {},
  rootDir: __dirname,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};



