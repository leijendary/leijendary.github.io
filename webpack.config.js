const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const sass = require('sass');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js',
    publicPath: '',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: ['last 5 versions'],
                  },
                  // For tree shaking to work
                  modules: false,
                },
              ],
            ],
          },
        },
      },
      {
        // Apply rule for .sass, .scss or .css files
        test: /\.(sa|sc|c)ss$/,
        // Set loaders to transform files.
        // Loaders are applying from right to left(!)
        // The first loader will be applied after others
        use: [
          {
            // After all CSS loaders we use plugin to do his work.
            // It gets all transformed CSS and extracts it into separate
            // single bundled file
            loader: MiniCssExtractPlugin.loader,
          },
          // This loader resolves url() and @imports inside CSS
          'css-loader',
          {
            // Then we apply postCSS fixes like autoprefixer and minifying
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [['postcss-preset-env']],
              },
            },
          },
          {
            // First we transform SASS to standard CSS
            loader: 'sass-loader',
            options: {
              implementation: sass,
            },
          },
        ],
      },
      {
        // Apply rule for shader files
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ['glslify-import-loader', 'raw-loader', 'glslify-loader'],
      },
      {
        // Apply rule for image files
        test: /\.(png|jpe?g|gif|svg)$/,
        use: [
          {
            // Using file-loader too
            loader: 'file-loader',
            options: {
              outputPath: 'img',
              name: '[name].[ext]',
            },
          },
        ],
      },
      {
        // Apply rule for fonts files
        test: /\.(woff|woff2|ttf|otf|eot)$/,
        use: [
          {
            // Using file-loader too
            loader: 'file-loader',
            options: {
              outputPath: 'fonts',
              name: '[name].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: ['!favicon/**', '!fonts/**', '!img/**', '!index.html', '!favicon.ico', '!CNAME'],
    }),
    new MiniCssExtractPlugin({
      filename: 'app.css',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/img',
          to: 'img',
        },
        {
          from: 'src/index.html',
          to: 'index.html',
        },
        {
          from: 'src/favicon',
          to: 'favicon',
        },
        {
          from: 'src/favicon.ico',
        },
        {
          from: 'CNAME',
        },
      ],
    }),
    new BrowserSyncPlugin(
      {
        // browse to http://localhost:9000/ during development,
        // ./dist directory is being served
        host: 'localhost',
        port: 80,
        open: false,
        server: {
          baseDir: ['dist'],
        },
        files: [
          {
            match: ['dist/*.css'],
            fn: function (event, file) {
              if (event === 'change') {
                this.reload('*.css');
              }
            },
          },
        ],
        ui: false,
      },
      {
        injectCss: true,
        reload: false,
      }
    ),
  ],
  watchOptions: {
    ignored: /node_modules/,
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
        extractComments: true,
      }),
    ],
  },
};
