const path = require('path');
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = (name) => {
  const coverageDirectory = path.join(__dirname, 'coverage', 'packages', name);
  return {
    resolver: '@nrwl/jest/plugins/resolver',
    globals: {
      'ts-jest': {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    },
    testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
    moduleFileExtensions: ['ts', 'js', 'jsx', 'tsx'],
    transform: {
      '^.+\\.(ts|js)x?$': 'ts-jest',
    },
    reporters: [
      'default',
      [
        'jest-junit',
        {
          usePathForSuiteName: 'true',
          classNameTemplate: '{classname}',
          outputDirectory: path.join(coverageDirectory, 'junit'),
          outputName: 'junit.xml',
        },
      ],
    ],
    coverageDirectory: coverageDirectory,
    coverageReporters: ['text'],
    testEnvironment: 'node',
  };
};
