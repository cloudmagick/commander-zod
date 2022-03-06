import { Command } from 'commander-zod';
export function commanderZodPrompt(): string {
  const cmd = new Command({ name: 'test' });
  return 'commander-zod-prompt';
}
