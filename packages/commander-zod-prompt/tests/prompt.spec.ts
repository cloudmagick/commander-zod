import { Command } from 'commander-zod';
import { z } from 'zod';
import { withPrompt } from '../src/lib/prompt';

it('should add Prompt mixin to Command', () => {
  const PromptableCommand = withPrompt(Command);
  const command = new PromptableCommand({
    name: 'test',
    useInteractivePrompt: false,
    parameters: {
      foo: {
        type: 'argument',
        schema: z.string(),
      },
      bar: {
        type: 'argument',
        schema: z.string(),
      },
      fizz: {
        type: 'option',
        schema: z.string().transform((v) => parseInt(v)),
      },
      buzz: {
        type: 'option',
        schema: z.string().transform((v) => parseInt(v)),
      },
    },
  }).action((props) => {
    expect({
      foo: props.foo,
      bar: props.bar,
      fizz: props.fizz,
      buzz: props.buzz,
    }).toEqual({
      foo: 'foo',
      bar: 'bar',
      fizz: 1,
      buzz: 2,
    });
  });

  command.parse(['node', 'test', 'foo', 'bar', '--fizz', '1', '--buzz', '2']);
  expect.assertions(1);
});
