'use strict';

module.exports = {
    // preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.jsx?$': 'babel-jest', // Adding this line solved the issue
        // '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.tsx?$': 'babel-jest',    // 因为现在 babel 支持 typescript 了, 所以直接用 babel, 不需要 ts-jest 了
    },
    // 从 ts-jest 里摘出来的, 匹配测试脚本
    testMatch: [
        '**/__tests__/**/*.js?(x)',
        '**/?(*.)+(spec|test).js?(x)',
        '**/__tests__/**/*.ts?(x)',
        '**/?(*.)+(spec|test).ts?(x)',
    ],
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