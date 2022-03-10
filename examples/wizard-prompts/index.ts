import { Command } from 'commander-zod';
import { withPrompt } from 'commander-zod-prompt';
import inquirer from 'inquirer';
import 'inquirer-date-prompt';
import { z } from 'zod';

const PromptableCommand = withPrompt(Command);

inquirer.registerPrompt('date', require('inquirer-date-prompt'));

const choices = ['tech', 'politics', 'business', 'shopping', 'sports'] as const;
const command = new PromptableCommand({
  name: 'wizard-prompts',
  parameters: {
    firstName: {
      type: 'argument',
      prompt: 'Enter your first name',
      schema: z.string().nonempty(),
    },
    lastName: {
      type: 'argument',
      prompt: 'Enter your last name',
      schema: z.string().nonempty(),
    },
    email: {
      type: 'option',
      prompt: 'Enter your email',
      schema: z.string().optional(),
    },
    dob: {
      type: 'option',
      required: true,
      prompt: () =>
        inquirer
          .prompt([
            {
              name: 'dob',
              type: 'date',
              message: 'Enter your Date of Birth',
              filter: (d: Date) =>
                new Date(d.getFullYear(), d.getMonth(), d.getDate()),
              format: {
                hour: undefined,
                minute: undefined,
              },
              clearable: true,
            },
          ])
          .then((res) => res.dob),
      schema: z.date(),
    },
    tags: {
      type: 'option',
      prompt: () =>
        inquirer
          .prompt({
            name: 'tags',
            type: 'checkbox',
            choices,
          })
          .then((res) => res.tags),
      schema: z.enum(choices).array().optional(),
    },
  },
}).action((props) => {
  console.log(props);
});

const main = async () => {
  await command.parseAsync();
};

main();
