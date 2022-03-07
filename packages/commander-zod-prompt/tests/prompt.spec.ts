import { CommanderError } from 'commander';
import { Command } from 'commander-zod';
import { createInquirerMock } from 'testkit';
import { z } from 'zod';
import { withPrompt } from '../src/lib/prompt';

it('should add Prompt mixin to Command', async () => {
  const PromptableCommand = withPrompt(Command);
  const command = new PromptableCommand({
    name: 'test',
    useDefaultInteractivePrompt: false,
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

  await command.parseAsync([
    'node',
    'test',
    'foo',
    'bar',
    '--fizz',
    '1',
    '--buzz',
    '2',
  ]);
  expect.assertions(1);
});

it('should call prompts for all unresolved parameters', async () => {
  const PromptableCommand = withPrompt(Command);
  const command = new PromptableCommand({
    name: 'test',
    useDefaultInteractivePrompt: false,
    parameters: {
      foo: {
        type: 'argument',
        schema: z.string(),
        prompt: () => Promise.resolve('foo'),
      },
      bar: {
        type: 'argument',
        schema: z.string(),
        prompt: () => Promise.resolve('bar'),
      },
      fizz: {
        type: 'option',
        schema: z.string().transform((v) => parseInt(v)),
        prompt: () => Promise.resolve('1'),
      },
      buzz: {
        type: 'option',
        schema: z.string().transform((v) => parseInt(v)),
        prompt: () => Promise.resolve('2'),
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

  await command.parseAsync(['node', 'test']);
  expect.assertions(1);
});

it('should call default prompts for unresolved parameters with priority given to config', async () => {
  const inquirerMock = createInquirerMock([
    { foo: 'foo' },
    { bar: 'bar' },
    { fizz: '1' },
    { buzz: '2' },
  ]);
  const PromptableCommand = withPrompt(Command, inquirerMock);
  const command = new PromptableCommand({
    name: 'test',
    useDefaultInteractivePrompt: true,
    fromConfig: () => ({
      fizz: '3', // <--- these should take precedence over the prompts
      buzz: '4',
    }),
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
      fizz: 3,
      buzz: 4,
    });
  });

  await command.parseAsync(['node', 'test']);
  expect.assertions(1);
});

it('should call default prompts for unresolved parameters with priority given to cli', async () => {
  const inquirerMock = createInquirerMock([
    { foo: 'foo' },
    { bar: 'bar' },
    { fizz: '1' },
    { buzz: '2' },
  ]);
  const PromptableCommand = withPrompt(Command, inquirerMock);
  const command = new PromptableCommand({
    name: 'test',
    useDefaultInteractivePrompt: true,
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
      foo: 'foo cli',
      bar: 'bar cli',
      fizz: 1,
      buzz: 2,
    });
  });

  await command.parseAsync(['node', 'test', 'foo cli', 'bar cli']);
  expect.assertions(1);
});

it('should have `_prepareUserArgs` as a private method on the Command', () => {
  const command = new Command({ name: 'test' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prepArgs = (command as any)._prepareUserArgs;
  expect(prepArgs).not.toBeNull();
  expect(typeof prepArgs).toEqual('function');
});

it('should disable prompts when --no-interactive flag is set', async () => {
  const PromptableCommand = withPrompt(Command);
  const command = new PromptableCommand({
    name: 'test',
    addDisableInteractivePromptFlag: true,
    parameters: {
      foo: {
        type: 'argument',
        schema: z.string(),
        prompt: () => Promise.resolve('foo'),
      },
      bar: {
        type: 'argument',
        schema: z.string(),
        prompt: () => Promise.resolve('bar'),
      },
    },
  })
    .action(() => {
      throw new Error('Action should not be called');
    })
    .exitOverride((err) => {
      throw err;
    });

  try {
    async () => await command.parseAsync(['node', 'test', '--no-interactive']);
  } catch (err) {
    expect((err as CommanderError).message).toMatch(
      /error: missing required argument 'foo'/
    );
  }
});
