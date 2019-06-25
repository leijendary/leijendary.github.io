import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import path from 'path';

module.exports = {
    entry: './src/js/app.js',
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: 'app.min.js'
    },
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html' })
    ]
}