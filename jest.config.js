'use strict';

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.jsx?$': 'babel-jest',    // Adding this line solved the issue
        '^.+\\.tsx?$': 'ts-jest',       // babel 的 typescript 实在太弱了, 还是暂时先用着原来的, 等全参数功能可用了再切过去吧
        // '^.+\\.tsx?$': 'babel-jest',    // 因为现在 babel 支持 typescript 了, 所以直接用 babel, 不需要 ts-jest 了
    },
    // 既然用了 ts-jest 了, 这里暂时就用不到了
    // 从 ts-jest 里摘出来的, 匹配测试脚本
    // testMatch: [
    //     '**/__tests__/**/*.js?(x)',
    //     '**/?(*.)+(spec|test).js?(x)',
    //     '**/__tests__/**/*.ts?(x)',
    //     '**/?(*.)+(spec|test).ts?(x)',
    // ],
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