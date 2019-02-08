// includes
// utils
const path = require('path');

// project data
const yaml = require('js-yaml');
const fs = require('fs');
const projectConfig = fs.readFileSync( path.resolve( __dirname, 'projectconfig.yml'),'utf8');
const projectData = yaml.load( projectConfig );

// plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin')

let getAlias = ()=> {

  let a = {
    '@src': path.resolve( __dirname, 'src/'),
    '@sizmek': path.resolve( __dirname, 'src/shared/sizmek/'),
    '@project': path.resolve( __dirname, `src/sizes/`)
  };

  Object.keys( projectData.sizes ).forEach( (size)=> {
    a[`@${size}`] = path.resolve( __dirname, `src/sizes/${ size }/` )
  });

  return a;

};

let config = {

    mode: 'production',
    // https://webpack.js.org/configuration/devtool/
    // This option controls if and how source maps are generated.
    devtool: false,

    optimization: {
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true
          }
        }
      },
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: false // set to true if you want JS source maps
        }),
        new OptimizeCSSAssetsPlugin({})
      ]
    },

    // https://webpack.js.org/concepts/loaders/
    module: {
      rules: [
        {
          test: /\.hbs$/,
          loader: "handlebars-loader"
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        },
        {
          test: /\.(css|scss)$/,
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { modules: true, importLoaders: 1 } },
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: [
                  require('autoprefixer')()
                ]
              }
            },
            "sass-loader"
          ]
        },
        {
          // Load all images as base64 encoding if they are smaller than 8192 bytes
          test: /\.(png|jpg|gif|svg)$/,
          use: [{
            loader: 'url-loader',
            options: {
              // On development we want to see where the file is coming from, hence we preserve the [path]
              name: '[path][name].[ext]?hash=[hash:20]',
              limit: 8192
            }
          }]
        }
      ],
    },

    resolve: {
      alias: getAlias()
    }

};

let Exports = [];

Object.keys( projectData.sizes ).forEach( (size)=> {

  Exports.push( Object.assign({}, config, {
      entry: `./src/sizes/${ size }/script.js`,
      plugins: [

        new CleanWebpackPlugin( path.resolve( __dirname, 'dist' ) ),

        new HtmlWebpackPlugin({

          template: path.resolve( __dirname, `src/sizes/${ size }/index.hbs`),
          hash: false,
          inject: true,
          alwaysWriteToDisk: true,
          minify: { collapseWhitespace: true },
          title: size,
          data: projectData,
          filename: path.resolve( __dirname, `dist/${ size }/index.html`)

        }),

        new HtmlWebpackHarddiskPlugin(),

        new MiniCssExtractPlugin({
          filename: "style.css"
        })

      ],
      output: {
        path: path.join( __dirname, `dist/${size}` ),
        publicPath: './',
        filename: 'index.js'
      },
  }) );

});


// Return Array of Configurations
module.exports = Exports;