// includes
// utils
const path = require('path');

// project data
const yaml = require('js-yaml');
const fs = require('fs');
const projectConfig = fs.readFileSync( path.resolve( __dirname, 'projectconfig.yml'),'utf8');
const projectData = yaml.load( projectConfig );
projectData.version = require('./package.json').version;

// plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default
const imageminMozjpeg = require('imagemin-mozjpeg');

let getAlias = ()=> {

	let a = {
		'@src': path.resolve( __dirname, 'src/'),
		'@sizmek': path.resolve( __dirname, 'src/shared/sizmek/'),
		'@images': path.resolve( __dirname, 'src/shared/images/'),
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
				loader: "handlebars-template-loader"
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
					{
						loader: 'css-loader',
						options: {
							modules: true,
							importLoaders: 1
						}
					},
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
				test: /\.(jpe?g|png|gif|svg)$/i,
				use: [
					{
						loader: 'file-loader',
						options: {
							outputPath: 'images/',
							publicPath: './images/',
							name: '[name].[ext]'
						}
					},
					{
						loader: 'image-webpack-loader',
						options: {
							mozjpeg: {
								progressive: true,
								quality: 30
							},
							optipng: {
								enabled: false,
							},
							pngquant: {
								quality: '10-20',
								speed: 4
							}
						}
					}
				]
			}
		],
	},

	resolve: {
		alias: getAlias()
	}

};

let Exports = [
	Object.assign( {}, config, {

		entry: `./src/landing/script.js`,

		plugins: [

		new CleanWebpackPlugin( path.resolve( __dirname, 'dist' ) ),

		new HtmlWebpackPlugin({

			template: path.resolve( __dirname, `src/landing/index.hbs`),
			hash: true,
			inject: true,
			alwaysWriteToDisk: true,
			minify: { collapseWhitespace: true },
			title: projectData.projectname,
			data: projectData,
			filename: path.resolve( __dirname, `dist/landing/index.html`)

		}),

		new HtmlWebpackHarddiskPlugin(),

		new MiniCssExtractPlugin({
			filename: "style.css"
		}),

		new CopyWebpackPlugin( [
			{
				from: path.resolve( __dirname, 'src/index.html'),
				to: path.resolve( __dirname, `dist/index.html`)
			},
			{
				from: path.resolve( __dirname, 'src/_redirects' ),
				to: path.resolve( __dirname, 'dist/[name]' )
			}
		] )

		],

		output: {
			path: path.join( __dirname, `dist/landing` ),
			publicPath: '/landing/',
			filename: 'index.js'
		}

	})
];

Object.keys( projectData.sizes ).forEach( (size)=> {

	Exports.push( Object.assign({}, config, {
		entry: `./src/sizes/${ size }/script.js`,
		plugins: [

			new HtmlWebpackPlugin({

				template: path.resolve( __dirname, `src/sizes/${ size }/index.hbs`),
				hash: true,
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
			}),

			new CopyWebpackPlugin( [ {
				from: path.resolve( __dirname, `src/sizes/${ size }/screenshot.+(png|jpg|jpeg)`),
				to: path.resolve( __dirname, `dist/${ size }/screenshot.[ext]`)
			} ] ),

			new ImageminPlugin({
				test: /\.(jpe?g|png|gif|svg)$/i,
				optipng: {
					optimizationLevel: 9
				},
				plugins: [
					imageminMozjpeg({
						quality: 30,
						progressive: true
					})
				]
			})

		],
		output: {
			path: path.join( __dirname, `dist/${size}` ),
			publicPath: `/${size}/`,
			filename: 'index.js'
		}
	}) );

});

// Return Array of Configurations
module.exports = Exports;