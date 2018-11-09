import {
  Builder,
  BuilderConfiguration,
  BuildEvent,
  BuilderContext
} from '@angular-devkit/architect';
import { NormalizedBrowserBuilderSchema } from '@angular-devkit/build-angular';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { join, getSystemPath, Path } from '@angular-devkit/core';
import { copyFileSync } from './copy.utils';
import { exec } from './exec.utils';
import { getGitInfo } from './git.utils';
import { readFileSync } from 'fs';

const yaml = require('yamljs');

interface GCloudBuilderOptions {
  browserTarget: string;
  applicationName?: string;
  version?: string;
  withoutActivation: boolean;
  yamlFilePath: string;
  requireLogin: boolean;
}

function createArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; i++) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

export default class GCloudBuilder implements Builder<GCloudBuilderOptions> {
  constructor(private context: BuilderContext) {}

  run(
    builderConfig: BuilderConfiguration<GCloudBuilderOptions>
  ): Observable<BuildEvent> {
    if (!builderConfig.options.applicationName) {
      builderConfig.options.applicationName = process.env.CUSTOM_GAE_PROJECT_ID;
    }

    if (!builderConfig.options.applicationName) {
      this.context.logger.log('error', 'No application name given');
      return of({
        success: false
      });
    }

    const architect = this.context.architect;
    const [
      project,
      target,
      configuration
    ] = builderConfig.options.browserTarget.split(':');
    const targetSpec = { project, target, configuration };
    const targetConfig = architect.getBuilderConfiguration<
      NormalizedBrowserBuilderSchema
    >(targetSpec);

    const originalOutputPath = targetConfig.options.outputPath;
    targetConfig.options.outputPath += '/static';

    return architect.run(targetConfig, this.context).pipe(
      switchMap(buildEvent => {
        if (!buildEvent.success) {
          return of(buildEvent);
        }
        const root = this.context.workspace.root;
        const yamlFilePath = builderConfig.options.yamlFilePath;

        this.copyYamlFile(root, originalOutputPath, yamlFilePath);
        const requireLogin = builderConfig.options.requireLogin
          ? this.requireLogin(root, originalOutputPath, yamlFilePath)
          : Promise.resolve();
        return requireLogin.then(() =>
          this.deployToGcloud(
            getSystemPath(join(root, originalOutputPath)),
            builderConfig.options
          )
        );
      })
    );
  }

  requireLogin(
    root: Path,
    distFolder: string,
    yamlFilePath: string
  ): Promise<void> {
    const yamlFile = yamlFilePath.split('/').pop();
    const distYamlFilePath = join(root, distFolder, yamlFile);
    const file = readFileSync(getSystemPath(distYamlFilePath));
    const existingConfig = yaml.parse(file.toString());
    const patchedHandlers = existingConfig.handlers.map((handler: any) => ({
      ...handler,
      login: 'admin'
    }));
    const patchedAppConfig = { ...existingConfig, handlers: patchedHandlers };

    return this.context.workspace.host
      .write(
        distYamlFilePath,
        createArrayBuffer(new Buffer(yaml.stringify(patchedAppConfig, 3)))
      )
      .toPromise();
  }

  copyYamlFile(root: Path, outputPath: string, yamlFilePath: string): void {
    const distFolder = getSystemPath(join(root, outputPath));
    const sourceYamlFilePath = getSystemPath(join(root, yamlFilePath));
    const yamlFile = sourceYamlFilePath.split('/').pop();
    copyFileSync(sourceYamlFilePath, distFolder + '/' + yamlFile);
  }

  async deployToGcloud(
    distFolder: string,
    options: GCloudBuilderOptions
  ): Promise<BuildEvent> {
    const cmd = 'gcloud';

    let args = ['app', 'deploy'];

    if (process.env.GOOGLE_OAUTH_TOKEN !== undefined) {
      args = args.concat([
        '--oauth2_access_token',
        process.env.GOOGLE_OAUTH_TOKEN
      ]);
    }

    const yamlFile = options.yamlFilePath.split('/').pop();

    if (!options.version) {
      const { short: commitId } = await getGitInfo();
      options.version = commitId;
    }

    args = args
      .concat([
        '--project',
        options.applicationName,
        '--version',
        options.version,
        '--quiet'
      ])
      .concat(
        !options.withoutActivation
          ? ['--stop-previous-version', '--promote']
          : [
              '--no-stop-previous-version', // We keep the previous version going until we have finalized the deployment
              '--no-promote' // We do not yet send any traffic to the new version
            ]
      )
      .concat([yamlFile]);

    this.context.logger.log(
      'info',
      `*** Deploying "${options.applicationName}" with arguments: ${args.join(
        ' '
      )}`
    );

    try {
      await exec(cmd, args, distFolder, (logLevel, line) => {
        this.context.logger.log(logLevel as any, line);
      });
      this.context.logger.log('info', 'Finished deployment');
      return { success: true };
    } catch (err) {
      this.context.logger.log('error', 'Deployment failed', err);
      return { success: false };
    }
  }
}
