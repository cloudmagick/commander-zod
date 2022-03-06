const baseConfigFn = require('../../jest.base.config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfigFn('commander-zod-prompt'),
  displayName: 'commander-zod-prompt',
};
