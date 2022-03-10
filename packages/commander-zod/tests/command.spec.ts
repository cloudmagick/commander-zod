import { z } from 'zod';
import { CommandProps } from '../src';
import { Command } from '../src/lib/command';

it('should call action handler with no parameters', () => {
  const command = new Command({
    name: 'args-parse-test',
  }).action((props) => {
    expect(props).toEqual({});
  });

  command.parse(['node', 'test']);

  const actual = command.processedArgs;
  expect(actual).toEqual([]);
});

it('should call action handler with parsed arguments', () => {
  const command = new Command({
    name: 'args-parse-test',
    parameters: {
      foo: {
        type: 'argument',
        required: true,
      },
      bar: {
        type: 'argument',
        required: true,
      },
    },
  }).action((props) => {
    expect(props).toEqual({
      foo: '1',
      bar: '2',
    });
  });

  command.parse(['node', 'test', '1', '2']);
  expect.assertions(1);
});

it('should call action handler with parsed options and arguments', () => {
  const numberSchema = z
    .string()
    .transform((v) => parseInt(v))
    .optional();
  const command = new Command({
    name: 'args-parse-test',
    parameters: {
      foo: {
        type: 'argument',
        required: true,
        schema: numberSchema,
      },
      bar: {
        type: 'argument',
        required: true,
        schema: numberSchema,
      },
      fizz: {
        type: 'option',
        schema: numberSchema,
        names: {
          alias: 'fz',
        },
      },
      buzz: {
        type: 'option',
        schema: numberSchema,
        defaultValue: '4',
      },
    },
  }).action((props) => {
    expect(props).toEqual({
      foo: 1,
      bar: 2,
      fizz: 3,
      buzz: 4,
    });
  });

  command.parse(['node', 'test', '1', '2', '-fz', '3']);
});

it('should call action handler with extra options', () => {
  const numberSchema = z
    .string()
    .transform((v) => parseInt(v))
    .optional();
  const command = new Command({
    name: 'args-parse-test',
    parameters: {
      foo: {
        type: 'argument',
        required: true,
        schema: numberSchema,
      },
      bar: {
        type: 'argument',
        required: true,
        schema: numberSchema,
      },
      fizz: {
        type: 'option',
        schema: numberSchema,
        names: {
          alias: 'fz',
        },
      },
      buzz: {
        type: 'option',
        schema: numberSchema,
        defaultValue: '4',
      },
      boom: {
        type: 'option',
        fromConfig: () => ({
          ding: 'dong',
          ping: 'pong',
        }),
      },
    },
  }).action((props, extras) => {
    expect({
      props,
      extras,
    }).toEqual({
      props: {
        foo: 1,
        bar: 2,
        fizz: 3,
        buzz: 4,
        boom: 'config',
      },
      extras: {
        args: [],
        props: {
          ding: 'dong',
          ping: 'pong',
        },
      },
    });
  });

  command.parse(['node', 'test', '1', '2', '-fz', '3', '--boom', 'config']);
});

it('should pass options from preAction hook to nested commmands', () => {
  const numberSchema = z.string().transform((v) => parseInt(v));
  const actual = {} as CommandProps;
  const parent = new Command({
    name: 'parent',
    parameters: {
      foo: {
        type: 'option',
        required: true,
        schema: numberSchema,
      },
      bar: {
        type: 'option',
        schema: numberSchema.optional(),
      },
    },
  })
    .passThroughOptions()
    .enablePositionalOptions()
    .hook('preAction', (props, _, __, ___, target) => {
      actual.props = {
        ...props,
      };
      target.setOptionValue('foo', props.foo);
      target.setOptionValue('bar', props.bar);
    });

  new Command({
    name: 'nested',
    parentCommand: parent,
    parameters: {
      fizz: {
        type: 'option',
        required: true,
        schema: z.string(),
      },
      buzz: {
        type: 'option',
        variadic: true,
        schema: numberSchema.array().optional(),
      },
    },
  }).action((props, extras, parent) => {
    actual.props = {
      ...props,
    };
    actual.extras = {
      ...extras,
    };
    actual.parent = {
      ...parent.props,
    };
  });

  parent.parse([
    'node',
    'parent',
    '--bar',
    '2',
    '--foo',
    '1',
    'nested',
    '--fizz',
    '3',
    '--buzz',
    '4',
    '5',
    '6',
  ]);
  expect(actual).toEqual({
    props: {
      fizz: '3',
      buzz: [4, 5, 6],
    },
    extras: {
      args: [],
      props: { foo: 1, bar: 2 },
    },
    parent: {
      foo: 1,
      bar: 2,
    },
  });
});

it('should call async nested actions', async () => {
  const numberSchema = z
    .string()
    .transform(async (v) => await Promise.resolve(parseInt(v)));
  const parent = new Command({ name: 'parent' })
    .passThroughOptions()
    .enablePositionalOptions();
  new Command({
    name: 'nested1',
    parentCommand: parent,
    fromConfig: () => ({
      foo: '1',
      bar: '2',
    }),
    parameters: {
      foo: {
        type: 'argument',
        required: true,
        schema: z.string(),
      },
      bar: {
        type: 'option',
        schema: z.string().optional(),
      },
    },
  }).action(async (props, extras) => {
    expect({
      props,
      extras,
    }).toEqual({
      props: { foo: 'override', bar: 'override' },
      extras: {
        args: [],
        props: {},
      },
    });
    return Promise.resolve();
  });

  new Command({
    name: 'nested2',
    parentCommand: parent,
    parameters: {
      fizz: {
        type: 'option',
        required: true,
        schema: z.string(),
      },
      buzz: {
        type: 'option',
        variadic: true,
        schema: numberSchema.array().optional(),
      },
    },
  }).action(async (props, extras) => {
    expect({
      props,
      extras,
    }).toEqual({
      props: { fizz: '3', buzz: [4, 5, 6] },
      extras: {
        args: [],
        props: {},
      },
    });
    return Promise.resolve();
  });

  await parent.parseAsync([
    'node',
    'parent',
    'nested1',
    'override',
    '--bar',
    'override',
  ]);
  expect.assertions(1);
});
