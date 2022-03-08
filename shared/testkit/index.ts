import inquirer from 'inquirer';

export const testLog = (obj: unknown) => {
  if (process.env.TEST_LOG) {
    console.log(JSON.stringify(obj, null, 2));
  }
};

export const createInquirerMock = (
  answers: Record<string, unknown> | Record<string, unknown>[]
) => {
  const inquirerMock = jest.mocked(inquirer, true);
  const mockFn = jest.fn();
  if (answers.length) {
    mockFn.mockImplementation((props) =>
      Promise.resolve(
        (answers as Record<string, unknown>[]).find((ans) => ans[props[0].name])
      )
    );
  } else {
    mockFn.mockResolvedValue(answers);
  }
  inquirerMock.prompt = mockFn as any;
  return inquirerMock;
};
