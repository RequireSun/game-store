'use strict';

const path = require('path');

const Webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('../webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');

const config = {
    ...webpackConfig,
    entry: './example/js/app.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'app.js',
    },
    mode: 'development',
    devtool: 'inline-source-map',
};

// 入口 html
if (!config.plugins) {
    config.plugins = [];
}
config.plugins.push(new HtmlWebpackPlugin({
    template: 'example/index.html',
    filename: 'index.html',
}));

//如果填写了 open 字段,则要清理 OpenBrowserPlugin
if (config.devServer.open && config.devServer.openPage) {
    for (let i = 0; i < config.plugins.length;) {
        let item = config.plugins[i];
        if (item.constructor && /OpenBrowserPlugin/.test(item.constructor.toString())) {
            config.plugins.splice(i, 1);
        } else {
            i++;
        }
    }

    //用这种方式打开
    config.plugins.push(new OpenBrowserPlugin({
        browser: config.devServer.open,
        url: config.devServer.openPage,
    }));
}

// // 添加 example 入口
// if (Array.isArray(config.entry)) {
//     config.entry.push('./example/js/app.ts');
// } else if ('string' === typeof(config.entry)) {
//     config.entry = [
//         config.entry,
//         './example/js/app.ts',
//     ];
// }


const compiler = Webpack(config);
const devServerOptions = {
    ...config.devServer,
};

const server = new WebpackDevServer(compiler, devServerOptions);

server.listen(devServerOptions.port, devServerOptions.host, () => {
    console.log(`starting server on host: ${devServerOptions.host} port: ${devServerOptions.port}`);
});