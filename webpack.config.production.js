// webpack.config.js
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const libraryName = 'game-store';
const outputFile = libraryName + '.js';

const config = {
    entry: __dirname + '/src/game-store.js',
    output: {
        path: __dirname + '/dist',
        filename: outputFile,
        library: libraryName,
        libraryTarget: 'umd',
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
        new CleanWebpackPlugin(['dist']),
    ],
};

module.exports = config;