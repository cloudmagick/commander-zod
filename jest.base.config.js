const path = require('path');
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = (name) => {
  const coverageDirectory = path.join(__dirname, 'coverage', 'packages', name);
  console.log({
    coverageDirectory,
  });
  return {
    testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
    moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
    transform: {
      '^.+\\.(ts|js)$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
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
