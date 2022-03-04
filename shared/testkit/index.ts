export const testLog = (obj: unknown) => {
  if (process.env.TEST_LOG) {
    console.log(JSON.stringify(obj, null, 2));
  }
};
