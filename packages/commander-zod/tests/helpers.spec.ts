import { Argument } from 'commander';
import { z } from 'zod';
import {
  dashifyName,
  environmentName,
  getParameterNames,
  mergeArgumentsFromConfig,
  splitParametersByType,
} from '../src/lib/helpers';

describe('mergeArgumentsFromConfig', () => {
  it('should merge arguments from config in proper order when no source arguments (required, optional, variadic)', () => {
    const actual = mergeArgumentsFromConfig([], {
      foo: {
        name: 'foo',
        type: 'argument',
        definition: {
          type: 'argument',
          required: true,
        },
        parameter: new Argument('foo'),
        value: 1,
      },
      bar: {
        name: 'bar',
        type: 'argument',
        definition: {
          type: 'argument',
          required: false,
        },
        parameter: new Argument('bar'),
        value: 3,
      },
      fizz: {
        name: 'fizz',
        type: 'argument',
        definition: {
          type: 'argument',
          required: false,
          variadic: true,
        },
        parameter: new Argument('fizz'),
        value: 4,
      },
      buzz: {
        name: 'buzz',
        type: 'argument',
        definition: {
          type: 'argument',
          required: true,
        },
        parameter: new Argument('buzz'),
        value: 2,
      },
    });
    expect(actual).toEqual([1, 2, 3, 4]);
  });
  it('should merge arguments from config in proper order when source arguments exist (required, optional, variadic)', () => {
    const actual = mergeArgumentsFromConfig(['1', '2', '3'], {
      foo: {
        name: 'foo',
        type: 'argument',
        definition: {
          type: 'argument',
          required: true,
        },
        parameter: new Argument('foo'),
        value: 1,
      },
      bar: {
        name: 'bar',
        type: 'argument',
        definition: {
          type: 'argument',
          required: false,
        },
        parameter: new Argument('bar'),
        value: 3,
      },
      fizz: {
        name: 'fizz',
        type: 'argument',
        definition: {
          type: 'argument',
          required: false,
          variadic: true,
        },
        parameter: new Argument('fizz'),
        value: 4,
      },
      buzz: {
        name: 'buzz',
        type: 'argument',
        definition: {
          type: 'argument',
          required: true,
        },
        parameter: new Argument('buzz'),
        value: 2,
      },
    });
    expect(actual).toEqual(['1', '2', '3', 4]);
  });
  it('should merge arguments from config in proper order with expanded variadic arguments', () => {
    const actual = mergeArgumentsFromConfig(['1'], {
      foo: {
        name: 'foo',
        type: 'argument',
        definition: {
          type: 'argument',
          required: true,
        },
        parameter: new Argument('foo'),
        value: 1,
      },
      bar: {
        name: 'bar',
        type: 'argument',
        definition: {
          type: 'argument',
          required: true,
        },
        parameter: new Argument('bar'),
        value: [2, 3, 4, 5],
      },
    });
    expect(actual).toEqual(['1', 2, 3, 4, 5]);
  });
  it('should merge arguments from config with preserved order for required and optional arguments', () => {
    const actual = mergeArgumentsFromConfig([], {
      foo: {
        name: 'foo',
        type: 'argument',
        definition: {
          type: 'argument',
          required: true,
        },
        parameter: new Argument('foo'),
        value: 1,
      },
      bar: {
        name: 'bar',
        type: 'argument',
        definition: {
          type: 'argument',
          required: true,
        },
        parameter: new Argument('bar'),
        value: 2,
      },
      fizz: {
        name: 'fizz',
        type: 'argument',
        definition: {
          type: 'argument',
          required: false,
        },
        parameter: new Argument('fizz'),
        value: 3,
      },
      buzz: {
        name: 'buzz',
        type: 'argument',
        definition: {
          type: 'argument',
          required: false,
        },
        parameter: new Argument('buzz'),
        value: 4,
      },
    });
    expect(actual).toEqual([1, 2, 3, 4]);
  });
});
describe('dashifyName', () => {
  it('should dashify camelCase (canonical use case)', () => {
    const actual = dashifyName('camelCaseParameter');
    expect(actual).toEqual('camel-case-parameter');
  });
  it('should not dashify all lower case characters', () => {
    const actual = dashifyName('reallylongname');
    expect(actual).toEqual('reallylongname');
  });
  it('should lower case all upper case characters', () => {
    const actual = dashifyName('UPPER');
    expect(actual).toEqual('upper');
  });
  it('should retain dashes', () => {
    const actual = dashifyName('dashified-name-here');
    expect(actual).toEqual('dashified-name-here');
  });
  it('should convert underscores to dashes', () => {
    const actual = dashifyName('snake_case');
    expect(actual).toEqual('snake-case');
  });
});

describe('environmentName', () => {
  it('should convert camel case to environment name (canonical use case)', () => {
    const actual = environmentName('camelCaseParameter');
    expect(actual).toEqual('CAMEL_CASE_PARAMETER');
  });
  it('should retain all upper case', () => {
    const actual = environmentName('REALLYLONGNAME');
    expect(actual).toEqual('REALLYLONGNAME');
  });
  it('should upper case all lower case characters', () => {
    const actual = environmentName('lower');
    expect(actual).toEqual('LOWER');
  });
  it('should upper case all lower case characters', () => {
    const actual = environmentName('lower');
    expect(actual).toEqual('LOWER');
  });
  it('should retain underscores', () => {
    const actual = environmentName('snake_case');
    expect(actual).toEqual('SNAKE_CASE');
  });
  it('should convert dashes to underscores', () => {
    const actual = environmentName('a-dashified-name');
    expect(actual).toEqual('A_DASHIFIED_NAME');
  });
});
describe('getParameterNames', () => {
  it('should get parameter names for camel-cased parameter', () => {
    const actual = getParameterNames('camelCase', {
      type: 'option',
      schema: z.any(),
      names: {
        alias: 'cc',
      },
    });
    const expected: typeof actual = {
      param: 'camel-case',
      alias: 'cc',
      config: 'camelCase',
      env: 'CAMEL_CASE',
    };

    expect(actual).toEqual(expected);
  });

  it('should get parameter name overrides', () => {
    const actual = getParameterNames('camelCase', {
      type: 'option',
      schema: z.any(),
      names: {
        alias: 'cc',
        config: 'camel-case',
        env: 'CAMELCASE',
      },
    });
    const expected: typeof actual = {
      param: 'camel-case',
      alias: 'cc',
      config: 'camel-case',
      env: 'CAMELCASE',
    };

    expect(actual).toEqual(expected);
  });
});
describe('splitParametersByName', () => {
  it('should be empty when no parameters are passed', () => {
    const actual = splitParametersByType({});
    expect(actual).toEqual([{}, {}]);
  });
  it('should return arguments when no options', () => {
    // `toMatchObject` matcher performs a transform that turns
    // the zod parsers into an Object type causing comparisons
    // to fail
    const actual = splitParametersByType({
      foo: {
        type: 'argument',
        schema: {} as z.AnyZodObject,
      },
      bar: {
        type: 'argument',
        schema: {} as z.AnyZodObject,
      },
    });
    expect(actual).toEqual([
      {
        foo: {
          type: 'argument',
          schema: {},
        },
        bar: {
          type: 'argument',
          schema: {},
        },
      },
      {},
    ]);
  });
  it('should return options when no arguments', () => {
    // `toMatchObject` matcher performs a transform that turns
    // the zod parsers into an Object type causing comparisons
    // to fail
    const actual = splitParametersByType({
      foo: {
        type: 'option',
        schema: {} as z.AnyZodObject,
      },
      bar: {
        type: 'option',
        schema: {} as z.AnyZodObject,
      },
    });
    expect(actual).toEqual([
      {},
      {
        foo: {
          type: 'option',
          schema: {},
        },
        bar: {
          type: 'option',
          schema: {},
        },
      },
    ]);
  });
  it('should return options and arguments', () => {
    // `toMatchObject` matcher performs a transform that turns
    // the zod parsers into an Object type causing comparisons
    // to fail
    const actual = splitParametersByType({
      fizz: {
        type: 'argument',
        schema: {} as z.AnyZodObject,
      },
      buzz: {
        type: 'argument',
        schema: {} as z.AnyZodObject,
      },
      foo: {
        type: 'option',
        schema: {} as z.AnyZodObject,
      },
      bar: {
        type: 'option',
        schema: {} as z.AnyZodObject,
      },
    });
    expect(actual).toEqual([
      {
        fizz: {
          type: 'argument',
          schema: {} as z.AnyZodObject,
        },
        buzz: {
          type: 'argument',
          schema: {} as z.AnyZodObject,
        },
      },
      {
        foo: {
          type: 'option',
          schema: {},
        },
        bar: {
          type: 'option',
          schema: {},
        },
      },
    ]);
  });
});
