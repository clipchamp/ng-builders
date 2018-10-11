
# Installation

1. Install Stryker and the necessary plugins for your Angular app
    npm i -D stryker stryker-api stryker-typescript stryker-jest-runner

2. Install stryker-run builder
	npm i -D @clipchamp/ng-builders

3. Add custom architect config to your angular.json
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

4. Configure Stryker:
You can either pass a configuration file through the options object in the architect or configure Stryker directly there.

5. Run Stryker:

    ng run my-app:mutate
