import GCloudBuilder from './gcloud.builder';
import { of } from 'rxjs';
import { Path } from '@angular-devkit/core';

jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

jest.mock('fs', () => ({
  copyFile: jest.fn()
}));

describe('GCloudBuilder', () => {
  let context: any;
  let builder: GCloudBuilder;

  beforeEach(() => {
    context = {
      logger: { log: jest.fn() },
      architect: {
        getBuilderConfiguration: jest.fn(),
        getBuilderDescription: jest.fn(),
        getBuilder: jest.fn()
      }
    };
    builder = new GCloudBuilder(context);
  });

  it('should create', () => {
    expect(builder).toBeTruthy();
  });

  describe('should find the target builder', () => {
    let targetBuilder: any;

    beforeEach(() => {
      context.architect.getBuilderConfiguration.mockImplementationOnce(() => ({
        target: 'config',
        options: {
          outputPath: 'test'
        }
      }));
      context.architect.getBuilderDescription.mockImplementationOnce(() =>
        of({ builder: 'description' })
      );
      targetBuilder = {
        run: jest.fn().mockImplementationOnce(() => of({ success: true }))
      };
      context.architect.getBuilder.mockImplementationOnce(() => targetBuilder);
    });

    it('without any configuration passed', () => {
      builder.run({
        options: {
          browserTarget: 'project:builder',
          applicationName: 'foo',
          version: 'bar',
          withoutActivation: false,
          yamlFilePath: 'test.yaml'
        }
      } as any);

      expect(context.architect.getBuilderConfiguration).toHaveBeenCalledWith({
        project: 'project',
        target: 'builder',
        configuration: undefined
      });
    });

    it('with the correct configuration', () => {
      builder.run({
        options: {
          browserTarget: 'project:builder:configuration',
          applicationName: 'foo',
          version: 'bar',
          withoutActivation: false,
          yamlFilePath: 'test.yaml'
        }
      } as any);

      expect(context.architect.getBuilderConfiguration).toHaveBeenCalledWith({
        project: 'project',
        target: 'builder',
        configuration: 'configuration'
      });
    });

    it('and run it successfully', () => {
      jest
        .spyOn(builder, 'copyYamlFile')
        .mockReturnValueOnce(Promise.resolve());
      jest
        .spyOn(builder, 'deployToGcloud')
        .mockReturnValueOnce(of({ success: true }));
      return builder
        .run({
          options: {
            browserTarget: 'project:builder:configuration',
            applicationName: 'foo',
            version: 'bar',
            withoutActivation: false,
            yamlFilePath: 'test.yaml'
          }
        } as any)
        .toPromise()
        .then(event => {
          expect(event).toEqual({ success: true });
          expect(context.architect.getBuilderDescription).toHaveBeenCalledWith({
            target: 'config',
            options: {
              outputPath: 'test'
            }
          });
          expect(context.architect.getBuilder).toHaveBeenCalledWith(
            { builder: 'description' },
            context
          );
          expect(targetBuilder.run).toHaveBeenCalledWith({
            target: 'config',
            options: {
              outputPath: 'test'
            }
          });
          expect(builder.copyYamlFile).toHaveBeenCalled();
          expect(builder.deployToGcloud).toHaveBeenCalled();
        });
    });

    it('and run it unsuccessfully', () => {
      targetBuilder.run.mockReset();
      targetBuilder.run.mockReturnValueOnce(of({ success: false }));
      jest
        .spyOn(builder, 'copyYamlFile')
        .mockReturnValueOnce(Promise.resolve());
      jest
        .spyOn(builder, 'deployToGcloud')
        .mockReturnValueOnce(of({ success: true }));
      return builder
        .run({
          options: {
            browserTarget: 'project:builder:configuration',
            applicationName: 'foo',
            version: 'bar',
            withoutActivation: false,
            yamlFilePath: 'test.yaml'
          }
        } as any)
        .toPromise()
        .then(event => {
          expect(event).toEqual({ success: false });
          expect(context.architect.getBuilderDescription).toHaveBeenCalledWith({
            target: 'config',
            options: {
              outputPath: 'test'
            }
          });
          expect(context.architect.getBuilder).toHaveBeenCalledWith(
            { builder: 'description' },
            context
          );
          expect(targetBuilder.run).toHaveBeenCalledWith({
            target: 'config',
            options: {
              outputPath: 'test'
            }
          });
          expect(builder.copyYamlFile).not.toHaveBeenCalled();
          expect(builder.deployToGcloud).not.toHaveBeenCalled();
        });
    });
  });

  it('should copy the yaml file to the dist folder', () => {
    const copyFile = require('fs').copyFile;
    builder.copyYamlFile(
      '<root>' as Path,
      'dist/project',
      'project/src/app.yaml'
    );
    expect(copyFile).toHaveBeenCalledWith(
      '<root>/project/src/app.yaml',
      '<root>/dist/project/app.yaml',
      expect.any(Function)
    );
  });

  describe('should create the correct command to deploy app to gcloud', () => {
    it('without activating new deployment', () => {
      builder.deployToGcloud('<root>/dist', {
        browserTarget: 'abc',
        applicationName: 'foo',
        version: 'bar',
        withoutActivation: false,
        yamlFilePath: 'test.yaml',
        requireLogin: false
      });
      const spawn = require('child_process').spawn;
      expect(spawn).toHaveBeenCalledWith(
        'gcloud app deploy --project foo --version bar --quiet --no-stop-previous-version --no-promote test.yaml',
        expect.any(Function)
      );
    });

    it('with activating new deployment', () => {
      builder.deployToGcloud('<root>/dist', {
        browserTarget: 'abc',
        applicationName: 'foo',
        version: 'bar',
        withoutActivation: true,
        yamlFilePath: 'test.yaml',
        requireLogin: false
      });
      const spawn = require('child_process').spawn;
      expect(spawn).toHaveBeenCalledWith(
        'gcloud app deploy --project foo --version bar --quiet --stop-previous-version --promote test.yaml',
        expect.any(Function)
      );
    });

    it('with Google OAuth token', () => {
      process.env.GOOGLE_OAUTH_TOKEN = 'abcdef';
      builder.deployToGcloud('<root>/dist', {
        browserTarget: 'abc',
        applicationName: 'foo',
        version: 'bar',
        withoutActivation: true,
        yamlFilePath: 'test.yaml',
        requireLogin: false
      });
      const spawn = require('child_process').spawn;
      expect(spawn).toHaveBeenCalledWith(
        'gcloud app deploy --oauth2_access_token abcdef --project foo --version bar --quiet --stop-previous-version --promote test.yaml',
        expect.any(Function)
      );
      delete process.env.GOOGLE_OAUTH_TOKEN;
    });
  });
});
