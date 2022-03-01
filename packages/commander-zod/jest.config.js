const baseConfigFn = require('../../jest.base.config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfigFn('commander-zod'),
  displayName: 'commander-zod',
  testPathIgnorePatterns: ['<rootDir>/tests/testkit'],
};
