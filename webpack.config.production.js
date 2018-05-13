// webpack.config.js
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const libraryName = 'game-store';
const outputFile = libraryName + '.js';


// "main": "dist/vue.runtime.common.js",
//     "module": "dist/vue.runtime.esm.js",
//     "unpkg": "dist/vue.js",
//     "jsdelivr": "dist/vue.js",

const config = {
    entry: __dirname + '/src/game-store.js',
    output: {
        path: __dirname + '/dist',
        filename: outputFile,
        library: libraryName,
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    //TODO esm
    // output: {
    //     path: __dirname + '/dist',
    //     // filename: outputFile,
    //     library: {
    //         root: "game-store",
    //         amd: "game-store",
    //         commonjs: "game-store.common"
    //     },
    //     libraryTarget: "umd",
    // },
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