import { Command } from 'commander-zod';
import { withPrompt } from 'commander-zod-prompt';
import { z } from 'zod';

const say = new Command({
  name: 'nested-with-default-prompts',
});

const PromptableCommand = withPrompt(Command);
new PromptableCommand({
  name: 'hello',
  parentCommand: say,
  useDefaultInteractivePrompt: true,
  addDisableInteractivePromptFlag: true,
  useEnvironment: true,
  parameters: {
    to: {
      type: 'argument',
      schema: z.string(),
    },
  },
}).action((props) => {
  console.log(`hello ${props.to}`);
});

new PromptableCommand({
  name: 'goodbye',
  parentCommand: say,
  useDefaultInteractivePrompt: true,
  addDisableInteractivePromptFlag: true,
  parameters: {
    to: {
      type: 'argument',
      schema: z.string(),
    },
  },
}).action((props) => {
  console.log(`goodbye ${props.to}`);
});

const main = async () => {
  await say.parseAsync();
};
main();
