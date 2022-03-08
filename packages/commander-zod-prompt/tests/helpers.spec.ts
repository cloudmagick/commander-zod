import { createInquirerMock } from '../../../shared/testkit';
import { getPrompt } from '../src/lib/helpers';

describe('getPrompt', () => {
  it('should get default input prompt when no prompt provided', async () => {
    const inquirerMock = createInquirerMock({ foo: 'answer' });
    const prompt = getPrompt(
      'foo',
      {
        type: 'argument',
      },
      true,
      inquirerMock
    );
    const actual = await prompt?.();
    expect(actual).toEqual('answer');
    expect(inquirerMock.prompt).toBeCalledWith([
      {
        type: 'input',
        name: 'foo',
        message: 'Please enter a value for foo:',
        choices: undefined,
      },
    ]);
  });

  it('should get input prompt with custom display prompt', async () => {
    const inquirerMock = createInquirerMock({ foo: 'answer' });
    const prompt = getPrompt(
      'foo',
      {
        type: 'argument',
        prompt: 'Enter a value for argument foo',
      },
      true,
      inquirerMock
    );
    const actual = await prompt?.();
    expect(actual).toEqual('answer');
    expect(inquirerMock.prompt).toBeCalledWith([
      {
        type: 'input',
        name: 'foo',
        message: 'Enter a value for argument foo',
        choices: undefined,
      },
    ]);
  });

  it('should get list prompt when choices are provided', async () => {
    const inquirerMock = createInquirerMock({ foo: 'one' });
    const prompt = getPrompt(
      'foo',
      {
        type: 'argument',
        prompt: 'Select a value for argument foo',
        choices: ['one', 'two', 'three'],
      },
      true,
      inquirerMock
    );
    const actual = await prompt?.();
    expect(actual).toEqual('one');
    expect(inquirerMock.prompt).toBeCalledWith([
      {
        type: 'list',
        name: 'foo',
        message: 'Select a value for argument foo',
        choices: ['one', 'two', 'three'],
      },
    ]);
  });

  it('should return undefined when prompt does not exist and useDefaultInteractivePrompt is false', async () => {
    const inquirerMock = createInquirerMock({ foo: 'one' });
    const prompt = getPrompt(
      'foo',
      {
        type: 'argument',
        choices: ['one', 'two', 'three'],
      },
      false,
      inquirerMock
    );
    const actual = await prompt?.();
    expect(actual).toBeUndefined();
    expect(inquirerMock.prompt).not.toBeCalled();
  });

  it('should return custom prompt if provided', async () => {
    const inquirerMock = createInquirerMock({ foo: ['cb1', 'cb2'] });
    const prompt = getPrompt(
      'foo',
      {
        type: 'argument',
        prompt: () => inquirerMock.prompt([{ name: 'foo', type: 'checkbox' }]),
      },
      false
    );
    const actual = await prompt?.();
    expect(actual).toEqual({ foo: ['cb1', 'cb2'] });
  });
});
