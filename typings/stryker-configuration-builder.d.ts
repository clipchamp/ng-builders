import { Path } from '@angular-devkit/core';
import { StrykerOptions } from 'stryker-api/core';
import { StrykerBuilderSchema } from './schema';
export declare class StrykerConfigurationBuilder {
    constructor();
    buildConfiguration(root: Path, sourceRoot: Path | undefined, workspaceRoot: Path, options: Partial<StrykerBuilderSchema>): StrykerOptions;
}
