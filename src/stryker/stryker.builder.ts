import {
  Builder,
  BuilderConfiguration,
  BuilderContext,
  BuildEvent
} from '@angular-devkit/architect';
import { StrykerBuilderSchema } from './schema';
import { Observable } from 'rxjs';
import Stryker from 'stryker';
import { LogLevel } from 'stryker-api/core';

export default class StrykerBuilder implements Builder<StrykerBuilderSchema> {
  constructor(private context: BuilderContext) {}

  run(
    builderConfig: BuilderConfiguration<Partial<StrykerBuilderSchema>>
  ): Observable<BuildEvent> {
    const root = this.context.workspace.root;
    return new Observable<BuildEvent>(observer => {
      const strykerInstance = new Stryker({
        mutator: 'typescript',
        testRunner: 'jest',
        transpilers: [],
        coverageAnalysis: 'off',
        mutate: [root],
        files: [root],
        logLevel: LogLevel.Information,
        maxConcurrentTestRunners: 4
      });
      strykerInstance
        .runMutationTest()
        .then(results => {
          observer.next({
            success: true
          });
          // do something with results
          console.warn(results);
        })
        .catch(() => observer.next({ success: false }));
    });
  }
}
