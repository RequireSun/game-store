'use strict';

const Webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('../webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');

if (!webpackConfig.plugins) {
    webpackConfig.plugins = [];
}
webpackConfig.plugins.push(new HtmlWebpackPlugin({
    template: 'example/index.html',
    filename: 'index.html',
}));

//如果填写了 open 字段,则要清理 OpenBrowserPlugin
if (webpackConfig.devServer.open && webpackConfig.devServer.openPage) {
    for (let i = 0; i < webpackConfig.plugins.length;) {
        let item = webpackConfig.plugins[i];
        if (item.constructor && /OpenBrowserPlugin/.test(item.constructor.toString())) {
            webpackConfig.plugins.splice(i, 1);
        } else {
            i++;
        }
    }

    //用这种方式打开
    webpackConfig.plugins.push(new OpenBrowserPlugin({
        browser: webpackConfig.devServer.open,
        url: webpackConfig.devServer.openPage,
    }));
}

const compiler = Webpack(webpackConfig);
const devServerOptions = {
    ...webpackConfig.devServer,
};

const server = new WebpackDevServer(compiler, devServerOptions);

server.listen(devServerOptions.port, devServerOptions.host, () => {
    console.log(`starting server on host: ${devServerOptions.host} port: ${devServerOptions.port}`);
});