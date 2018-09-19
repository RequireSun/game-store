'use strict';

const path = require('path');

// 备注一下 npx 可以直接运行 node_modules 下面的命令

module.exports = {
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'game-store.js',
    },
    module: {
        rules: [{
            test: /\.ts$/,
            loader: 'babel-loader',
        }, ],
    },
    // env: {
    //     test: {
    //         "plugins": [
    //             "istanbul"
    //         ]
    //     }
    // }
};