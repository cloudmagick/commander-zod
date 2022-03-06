import { commanderZodPrompt } from '../src/lib/commander-zod-prompt';

describe('commanderZodPrompt', () => {
  it('should work', () => {
    expect(commanderZodPrompt()).toEqual('commander-zod-prompt');
  });
});
