import { readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import generator from '../src/generators/library/generator';
import { CommanderZodDevkitGeneratorSchema } from '../src/generators/library/schema';

describe('commander-zod-devkit generator', () => {
  let appTree: Tree;
  const options: CommanderZodDevkitGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });
});
