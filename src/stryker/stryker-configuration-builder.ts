import { existsSync } from 'fs';
import {
  normalize,
  Path,
  resolve,
  getSystemPath,
  join
} from '@angular-devkit/core';
import { Logger } from '@angular-devkit/core/src/logger';
import { StrykerOptions } from 'stryker-api/core';
import { StrykerBuilderSchema } from './schema';
import { Config } from 'stryker-api/config';

export class StrykerConfigurationBuilder {
  constructor(private logger: Logger) {}

  buildConfiguration(
    root: Path,
    sourceRoot: Path | undefined,
    workspaceRoot: Path,
    options: Partial<StrykerBuilderSchema>
  ): StrykerOptions {
    const { configPath, restrictToFolder, ...cliConfig } = options;

    const configRoot = root === '' ? sourceRoot || normalize('') : root;
    const projectRoot: Path = resolve(workspaceRoot, configRoot);

    const config = new Config();

    if (configPath) {
      const pathToGlobalConfig = getSystemPath(join(workspaceRoot, configPath));
      const pathToProjectConfig = getSystemPath(join(projectRoot, configPath));
      if (!existsSync(pathToGlobalConfig)) {
        this.logger.warn(
          `warning: unable to locate custom global stryker config file at path ${pathToGlobalConfig}`
        );
      } else {
        const customGlobalConfig = require(pathToGlobalConfig);
        customGlobalConfig(config);
      }
      if (!existsSync(pathToProjectConfig)) {
        this.logger.warn(
          `warning: unable to locate custom project-specific stryker config file at path ${pathToProjectConfig}`
        );
      } else {
        const customProjectConfig = require(pathToProjectConfig);
        customProjectConfig(config);
      }
    }

    const cliConfigKeys = Object.keys(cliConfig);
    if (cliConfig && cliConfigKeys.length > 0) {
      for (let key of cliConfigKeys) {
        if (key in cliConfig && cliConfig[key]) {
          if (Array.isArray(cliConfig[key]) && cliConfig[key].length === 0) {
            continue;
          }
          config.set({ [key]: cliConfig[key] });
        }
      }
    }

    // TODO: This is super specific to our use case right now - need to revisit this later...
    if (restrictToFolder) {
      const filesToMutate = `${restrictToFolder}/**/*.ts`;
      const specs = `!${restrictToFolder}/**/*.spec.ts`;
      const stubs = `!${restrictToFolder}/**/*.stub.ts`;
      const includeSpecs = `${restrictToFolder}/**/*.spec.ts`;
      config.set({
        mutate: [filesToMutate, specs, stubs],
        files: [...config.files, includeSpecs]
      })
      if (config.htmlReporter) {
        config.set({
          htmlReporter: {
            baseDir: `${config.htmlReporter.baseDir}/${restrictToFolder}`
          }
        })
      }
    }

    return config;
  }
}
