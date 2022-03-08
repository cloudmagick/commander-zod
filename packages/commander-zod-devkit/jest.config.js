const baseConfigFn = require('../../jest.base.config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfigFn('commander-zod-devkit'),
  displayName: 'commander-zod-devkit',
  testPathIgnorePatterns: ['<rootDir>/tests/testkit'],
};
