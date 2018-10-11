import { Path } from '@angular-devkit/core';
import { Logger } from '@angular-devkit/core/src/logger';
import { StrykerOptions } from 'stryker-api/core';
import { StrykerBuilderSchema } from './schema';
export declare class StrykerConfigurationBuilder {
    private logger;
    constructor(logger: Logger);
    buildConfiguration(root: Path, sourceRoot: Path | undefined, workspaceRoot: Path, options: Partial<StrykerBuilderSchema>): StrykerOptions;
}
