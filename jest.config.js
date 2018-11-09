module.exports = {
  globals: {
    'ts-jest': {
      diagnostics: false
    }
  },
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  testRegex: `${process.cwd()}/(?!(e2e|examples)/).+\\.spec\\.ts`,
  moduleFileExtensions: ['ts', 'js'],
  testEnvironment: './jest-custom-environment'
};
