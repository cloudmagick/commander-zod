import { Command } from '../src';
import { ParametersResolved } from '../src/lib/events';

it('should receive parameters resolve event', () => {
  const command = new Command({
    name: 'event-test',
    parameters: {
      foo: {
        type: 'argument',
      },
      bar: {
        type: 'argument',
      },
      fizz: {
        type: 'option',
        required: true,
      },
      buzz: {
        type: 'option',
      },
    },
  });
  command.subscribe<ParametersResolved>(
    'parameters-resolved',
    ({ message }) => {
      const parameters = message.parameters;
      const actual = {
        foo: parameters.foo.value,
        bar: parameters.bar.value,
        fizz: parameters.fizz.value,
        buzz: parameters.buzz.value,
      };
      expect(actual).toEqual({
        foo: 'foo',
        bar: 'bar',
        fizz: 'fizz',
        buzz: null,
      });
    }
  );
  command.parse(['node', 'test', 'foo', 'bar', '--fizz', 'fizz']);
  expect.assertions(1);
});
