'use strict';

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.jsx?$': 'babel-jest', // Adding this line solved the issue
        '^.+\\.tsx?$': 'ts-jest',
    },
    moduleFileExtensions: [
        'js',
        'jsx',
        'json',
        'ts',
        'tsx',
    ],
    globals: {
        'ts-jest': {
            tsConfigFile: 'tsconfig.json',
        },
    },
};