import { z } from 'zod';
import {
  validateParameterName,
  validateSingleVariadicArgument,
} from '../src/lib/validate';

describe('validateParameterName', () => {
  it('should require only a-z, A-Z, 0-9 +_', () => {
    expect(() => validateParameterName('bad&arg')).toThrow();
    expect(() => validateParameterName('bad+arg')).toThrow();
    expect(() => validateParameterName('bad.arg')).toThrow();
    expect(() => validateParameterName('goodArg')).not.toThrow();
    expect(() => validateParameterName('good-arg')).not.toThrow();
    expect(() => validateParameterName('good_arg')).not.toThrow();
  });
  it('should only start with alphanumeric characters', () => {
    expect(() => validateParameterName('&arg')).toThrow();
    expect(() => validateParameterName('1arg')).not.toThrow();
    expect(() => validateParameterName('arg')).not.toThrow();
  });
  it('should allow single alphanumeric character', () => {
    expect(() => validateParameterName('1')).not.toThrow();
    expect(() => validateParameterName('a')).not.toThrow();
  });
  it('should require names to end with alphanumeric character', () => {
    expect(() => validateParameterName('invalidArg_')).toThrow();
    expect(() => validateParameterName('invalid_Ending_')).toThrow();
    expect(() => validateParameterName('validArg1')).not.toThrow();
  });
  it('should not allow empty name', () => {
    expect(() => validateParameterName('')).toThrow();
  });
});
describe('validateSingleVariadicArgument', () => {
  it('should not allow multiple variadic arguments (canonical use case)', () => {
    expect(() =>
      validateSingleVariadicArgument({
        foo: {
          type: 'argument',
          schema: z.any(),
          variadic: true,
        },
        bar: {
          type: 'argument',
          schema: z.any(),
        },
        buzz: {
          type: 'argument',
          schema: z.any(),
          variadic: true,
        },
      })
    ).toThrow();
  });
  it('should allow no variadic arguments', () => {
    expect(() =>
      validateSingleVariadicArgument({
        foo: {
          type: 'argument',
          schema: z.any(),
        },
        bar: {
          type: 'argument',
          schema: z.any(),
        },
      })
    ).not.toThrow();
  });
});
