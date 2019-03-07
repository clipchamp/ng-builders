import { Builder, BuilderConfiguration, BuilderContext, BuildEvent } from '@angular-devkit/architect';
import { NormalizedBrowserBuilderSchema } from '@angular-devkit/build-angular';
import { getSystemPath, join } from '@angular-devkit/core';
import { copyFile } from 'fs';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { exec } from './exec.utils';

interface GCloudBuilderOptions {
    browserTarget: string;
    applicationName?: string;
    version?: string;
    withoutActivation: boolean;
    yamlFilePath: string;
    distFolder?: string;
    oAuth2AccessToken?: string;
    deployConfigPath?: string;
    skipBuild?: boolean;
}

type BeforeDeployHook = (
    options: GCloudBuilderOptions,
    targetOptions: NormalizedBrowserBuilderSchema
) => GCloudBuilderOptions | Promise<GCloudBuilderOptions>;
type AfterDeployHook = (options: GCloudBuilderOptions) => void | Promise<void>;

export default class GCloudBuilder implements Builder<GCloudBuilderOptions> {
    private beforeDeployHook: BeforeDeployHook = options => options;
    private afterDeployHook: AfterDeployHook = () => {};

    constructor(private context: BuilderContext) {}

    run({ options }: BuilderConfiguration<GCloudBuilderOptions>): Observable<BuildEvent> {
        const architect = this.context.architect;
        const [project, target, configuration] = options.browserTarget.split(':');
        const targetSpec = { project, target, configuration };
        const targetConfig = architect.getBuilderConfiguration<NormalizedBrowserBuilderSchema>(
            targetSpec
        );

        const { yamlFilePath, distFolder } = options;
        const yamlFile = yamlFilePath.split('/').pop();
        const workspaceRoot = this.context.workspace.root;
        const outputPath = targetConfig.options.outputPath;
        const modifiedOutputPath = distFolder ? outputPath + '/' + distFolder : outputPath;
        const srcYamlPath = getSystemPath(join(workspaceRoot, yamlFilePath));
        const distYamlPath = getSystemPath(join(workspaceRoot, outputPath, yamlFile));

        if (
            options.deployConfigPath &&
            this.context.host.exists(join(workspaceRoot, options.deployConfigPath))
        ) {
            const { beforeDeployHook, afterDeployHook } = require(getSystemPath(
                join(workspaceRoot, options.deployConfigPath)
            ));
            if (beforeDeployHook) {
                this.beforeDeployHook = beforeDeployHook;
            }
            if (afterDeployHook) {
                this.afterDeployHook = afterDeployHook;
            }
        }

        const build = options.skipBuild
            ? of({ success: true })
            : architect.run(
                  {
                      ...targetConfig,
                      options: { ...targetConfig.options, outputPath: modifiedOutputPath }
                  },
                  this.context
              );

        return build.pipe(
            switchMap(buildEvent => {
                if (!buildEvent.success) {
                    return of(buildEvent);
                }
                return this.copyFile(srcYamlPath, distYamlPath)
                    .then(() =>
                        Promise.resolve(this.beforeDeployHook(options, targetConfig.options))
                    )
                    .then(newOptions => {
                        if (!newOptions.applicationName) {
                            return {
                                success: false
                            };
                        }
                        return this.deployToGcloud(outputPath, yamlFile, newOptions);
                    })
                    .then(buildEvent => {
                        if (!buildEvent.success) {
                            return buildEvent;
                        }
                        return Promise.resolve(this.afterDeployHook(options)).then(
                            () => buildEvent
                        );
                    });
            })
        );
    }

    copyFile(srcPath: string, distPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            copyFile(srcPath, distPath, err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    async deployToGcloud(
        path: string,
        yamlFile: string,
        options: GCloudBuilderOptions
    ): Promise<BuildEvent> {
        const cmd = 'gcloud';
        let args = ['app', 'deploy'];

        if (options.oAuth2AccessToken) {
            args = args.concat(['--oauth2_access_token', options.oAuth2AccessToken]);
        }

        args = args
            .concat(['--project', options.applicationName, '--version', options.version, '--quiet'])
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
            `*** Deploying "${options.applicationName}" with arguments: ${args.join(' ')}`
        );

        try {
            await exec(cmd, args, path, (logLevel, line) => {
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
