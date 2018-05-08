// webpack.config.js
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// const libraryName = 'game-store';
// const outputFile = libraryName + '.js';

const config = {
    entry: {
        app: __dirname + '/example/js/index.js',
        lib: __dirname + '/src/game-store.js',
    },
    output: {
        path: __dirname + '/build',
        filename: `[name].bundle.js`,
        // library: libraryName,
        // libraryTarget: 'umd',
        // umdNamedDefine: true,
    },
    devtool: 'source-map',
    devServer: {
        contentBase: 'build',
        port: 9000,
        compress: true,     // gzip 压缩
        // hot: true,          // 热加载
        open: true,         // 自动打开浏览器
        openPage: '/index.html',    // 自动打开的页面
        progress: true,     // 运行进度输出到控制台
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
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
        new CleanWebpackPlugin(['build']),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'example/index.html',
        }),
    ],
};

module.exports = config;