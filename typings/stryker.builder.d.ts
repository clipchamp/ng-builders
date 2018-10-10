import { Builder, BuilderConfiguration, BuilderContext, BuildEvent } from '@angular-devkit/architect';
import { StrykerBuilderSchema } from './schema';
import { Observable } from 'rxjs';
export default class StrykerBuilder implements Builder<StrykerBuilderSchema> {
    private context;
    constructor(context: BuilderContext);
    run(builderConfig: BuilderConfiguration<Partial<StrykerBuilderSchema>>): Observable<BuildEvent>;
}
