// webpack.config.js
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const libraryName = 'game-store';

// "main": "dist/vue.runtime.common.js",
//     "module": "dist/vue.runtime.esm.js",
//     "unpkg": "dist/vue.js",
//     "jsdelivr": "dist/vue.js",

const config = {
    entry: __dirname + `/src/${libraryName}.js`,
    output: {
        path: __dirname + '/dist',
        filename: `${libraryName}.common.js`,
        library: libraryName,
        libraryTarget: 'commonjs-module',
        umdNamedDefine: true,
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.js$/,
                loader: "eslint-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
    },
    plugins: [
        new CleanWebpackPlugin([`dist/${libraryName}.common.js`]),
    ],
};

module.exports = config;