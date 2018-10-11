"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const core_1 = require("@angular-devkit/core");
const config_1 = require("stryker-api/config");
class StrykerConfigurationBuilder {
    constructor(logger) {
        this.logger = logger;
    }
    buildConfiguration(root, sourceRoot, workspaceRoot, options) {
        const { configPath } = options, cliConfig = __rest(options, ["configPath"]);
        const configRoot = root === '' ? sourceRoot || core_1.normalize('') : root;
        const projectRoot = core_1.resolve(workspaceRoot, configRoot);
        const config = new config_1.Config();
        if (configPath) {
            const pathToGlobalConfig = core_1.getSystemPath(core_1.join(workspaceRoot, configPath));
            const pathToProjectConfig = core_1.getSystemPath(core_1.join(projectRoot, configPath));
            if (!fs_1.existsSync(pathToGlobalConfig)) {
                this.logger.warn(`warning: unable to locate custom global stryker config file at path ${pathToGlobalConfig}`);
            }
            else {
                const customGlobalConfig = require(pathToGlobalConfig);
                customGlobalConfig(config);
            }
            if (!fs_1.existsSync(pathToProjectConfig)) {
                this.logger.warn(`warning: unable to locate custom project-specific stryker config file at path ${pathToProjectConfig}`);
            }
            else {
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
                    config.set({ key: cliConfig[key] });
                }
            }
        }
        return config;
    }
}
exports.StrykerConfigurationBuilder = StrykerConfigurationBuilder;
//# sourceMappingURL=stryker-configuration-builder.js.map