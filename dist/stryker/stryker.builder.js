"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const stryker_1 = require("stryker");
const stryker_configuration_builder_1 = require("./stryker-configuration-builder");
class StrykerBuilder {
    constructor(context) {
        this.context = context;
        this.configBuilder = new stryker_configuration_builder_1.StrykerConfigurationBuilder(context.logger);
    }
    run(builderConfig) {
        const { root, sourceRoot, options } = builderConfig;
        const workspaceRoot = this.context.workspace.root;
        const config = this.configBuilder.buildConfiguration(root, sourceRoot, workspaceRoot, options);
        return new rxjs_1.Observable(observer => {
            const strykerInstance = new stryker_1.default(config);
            strykerInstance
                .runMutationTest()
                .then(results => {
                // do something with results
                this.context.logger.info(JSON.stringify(results));
                observer.next({
                    success: true
                });
                observer.complete();
            })
                .catch(err => {
                this.context.logger.error(JSON.stringify(err));
                observer.next({ success: false });
                observer.complete();
            });
        });
    }
}
exports.default = StrykerBuilder;
//# sourceMappingURL=stryker.builder.js.map