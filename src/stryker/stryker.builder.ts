import {
  Builder,
  BuilderConfiguration,
  BuilderContext,
  BuildEvent
} from '@angular-devkit/architect';
import { StrykerBuilderSchema } from './schema';
import { Observable } from 'rxjs';
import Stryker from 'stryker';
import { StrykerConfigurationBuilder } from './stryker-configuration-builder';

export default class StrykerBuilder implements Builder<StrykerBuilderSchema> {
  private readonly configBuilder: StrykerConfigurationBuilder;

  constructor(private context: BuilderContext) {
    this.configBuilder = new StrykerConfigurationBuilder(context.logger);
  }

  run(
    builderConfig: BuilderConfiguration<Partial<StrykerBuilderSchema>>
  ): Observable<BuildEvent> {
    const { root, sourceRoot, options } = builderConfig;
    const workspaceRoot = this.context.workspace.root;
    const config = this.configBuilder.buildConfiguration(
      root,
      sourceRoot,
      workspaceRoot,
      options
    );
    return new Observable<BuildEvent>(observer => {
      const strykerInstance = new Stryker(config);
      strykerInstance
        .runMutationTest()
        .then(results => {
          observer.next({
            success: true
          });
          observer.complete();
        })
        .catch(err => {
          observer.next({ success: false });
          observer.complete();
        });
    });
  }
}
