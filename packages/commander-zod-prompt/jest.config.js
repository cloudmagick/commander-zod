// module.exports = {
//   displayName: 'commander-zod-prompt',
//   preset: '../../jest.preset.js',
//   globals: {
//     'ts-jest': {
//       tsconfig: '<rootDir>/tsconfig.spec.json',
//     },
//   },
//   testEnvironment: 'node',
//   transform: {
//     '^.+\\.[tj]sx?$': 'ts-jest',
//   },
//   moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
//   coverageDirectory: '../../coverage/packages/commander-zod-prompt',
// };
const baseConfigFn = require('../../jest.base.config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfigFn('commander-zod-prompt'),
  displayName: 'commander-zod-prompt',
};
