'use strict';

const os = require('os');
const path = require('path');
const DtsGeneratorPlugin = require('dts-generator-webpack-plugin').default;

// plugin-transform-runtime 复用公共函数, 缩小包大小 21k -> 20k
// plugin-proposal-decorators 必须放在 proposal-class-properties 之前

module.exports = {
    entry: './src/game-store.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'game-store.js',
    },
    devServer: {
        progress: true,
        open: 'win32' === os.platform() ? 'Chrome' : 'Google Chrome',
        openPage: 'http://127.0.0.1:8008/index.html',
        host: '0.0.0.0',
        port: 8008,
        contentBase: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            // {
            //     test: /\.ts$/,
            //     loader: 'babel-loader',
            // },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    // compilerOptions: {
                    //     declarationDir: 'types',
                    //     outDir: 'dist',
                    //     // outFile: 'game-store.js',
                    // },
                    // exclude: [
                    //     "example",
                    //     "test"
                    // ],
                },
            },
        ],
    },
    resolve: {
        extensions: [ '.ts', '.tsx', '.js', ],
    },
    // resolve: {
    //     extensions: ['.js', '.jsx', '.ts', '.tsx']
    // },
    mode: 'development',
    // mode: 'production',
    // env: {
    //     test: {
    //         "plugins": [
    //             "istanbul"
    //         ]
    //     }
    // },
    plugins: [
        new DtsGeneratorPlugin(require('./dts.config.js')),
    ],
};