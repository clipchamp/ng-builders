# Angular Stryker Builder

[![Build Status](https://travis-ci.org/clipchamp/ng-builders.svg?branch=master)](https://travis-ci.org/clipchamp/ng-builders)
[![npm](https://img.shields.io/npm/dt/@clipchamp/ng-builders.svg)](https://www.npmjs.com/package/@clipchamp/ng-builders)
[![npm](https://img.shields.io/npm/v/@clipchamp/ng-builders.svg)](https://www.npmjs.com/package/@clipchamp/ng-builders)

Easily integrate the Stryker Mutator framework for mutation testing into your Angular app(s).

## Installation

1. Install Stryker and the necessary plugins for your Angular app
```
npm i -D stryker stryker-api stryker-typescript stryker-jest-runner
```
2. Install stryker-run builder
```
npm i -D @clipchamp/ng-builders
```
3. Add custom architect config to your angular.json
```
[...]
"lint":  { 
    "builder":  "@angular-devkit/build-angular:tslint",
    "options":  {
	    "tsConfig":  ["src/tsconfig.json",  "src/tsconfig.spec.json"],
	    "exclude":  ["**/node_modules/**"]
    }
},
"mutate":  {
    	"builder":  "@clipchamp/ng-builders:run-stryker",
	"options":  {
		"configPath": "...." // path is relative to the project folder or workspace root (both are checked),
		"mutator": "typescript",
		[...]
	}
},
[...]
```

## Configuration

You can either pass a configuration file through the options object in the architect or configure Stryker directly there.

## Usage
Depending on how you called your architect you need to change this command.
```
    ng run my-app:mutate
```
