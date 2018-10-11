import { LogLevel } from 'stryker-api/core';

export interface StrykerBuilderSchema {
  configPath?: string;
  logLevel?: LogLevel;
  fileLogLevel?: LogLevel;
  mutator?: string;
  reporters?: string[];
  testRunner?: string;
  testFramework?: string;
  transpilers?: string[];
  coverageAnalysis?: 'perTest' | 'all' | 'off';
  mutate?: string[];
  files?: string[];
  maxConcurrentTestRunners?: number;
  symlinkNodeModules?: boolean;
  timeoutMS?: number;
  timeoutFactor?: number;
  plugins?: string[];
  port?: number;
  [custom: string]: any;
}
