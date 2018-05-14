// webpack.config.js
const CleanWebpackPlugin = require('clean-webpack-plugin');

const libraryName = 'game-store';

module.exports = function (env, argv) {
    const min = 'development' === argv.mode ? '' : '.min';

    return {
        entry: __dirname + `/src/${libraryName}.js`,
        output: {
            path: __dirname + '/dist',
            filename: `${libraryName}${min}.js`,
            library: libraryName,
            libraryTarget: 'umd',
            umdNamedDefine: true,
        },
        devtool: 'source-map',
        module: {
            rules: [{
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            }, {
                test: /\.js$/,
                loader: "eslint-loader",
                exclude: /node_modules/,
            },],
        },
        resolve: {
            extensions: ['.js'],
        },
        plugins: [
            new CleanWebpackPlugin([`dist/${libraryName}${min}.js`]),
        ],
    };
};