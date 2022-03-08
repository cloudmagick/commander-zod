import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';
describe('commander-zod-devkit e2e', () => {
  it('should create commander-zod-devkit', async () => {
    const plugin = uniq('commander-zod-devkit');
    ensureNxProject(
      'commander-zod-devkit',
      'dist/packages/commander-zod-devkit'
    );
    await runNxCommandAsync(`generate commander-zod-devkit:library ${plugin}`);
  }, 120000);

  describe('--directory', () => {
    it('should create src in the specified directory', async () => {
      const plugin = uniq('commander-zod-devkit');
      ensureNxProject(
        'commander-zod-devkit',
        'dist/packages/commander-zod-devkit'
      );
      await runNxCommandAsync(
        `generate commander-zod-devkit:library ${plugin} --directory subdir`
      );
      expect(() =>
        checkFilesExist(`libs/subdir/${plugin}/src/index.ts`)
      ).not.toThrow();
    }, 120000);
  });

  describe('--tags', () => {
    it('should add tags to the project', async () => {
      const plugin = uniq('commander-zod-devkit');
      ensureNxProject(
        'commander-zod-devkit',
        'dist/packages/commander-zod-devkit'
      );
      await runNxCommandAsync(
        `generate commander-zod-devkit:library ${plugin} --tags e2etag,e2ePackage`
      );
      const project = readJson(`libs/${plugin}/project.json`);
      expect(project.tags).toEqual(['e2etag', 'e2ePackage']);
    }, 120000);
  });
});
