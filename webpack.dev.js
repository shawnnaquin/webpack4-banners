// includes
// utils
const path = require('path');

// plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

// storage
let plugins = [];

// project data
const yaml = require('js-yaml');
const fs = require('fs');
const projectConfig = fs.readFileSync( path.resolve( __dirname, 'projectconfig.yml'),'utf8');
const projectData = yaml.load( projectConfig );


let getHTML = () => {

	let html = [

		new HtmlWebpackPlugin({

			template: path.resolve( __dirname, `src/landing/index.hbs`),
			chunks: [ 'landing' ],
			hash: true,
			inject: true,
			alwaysWriteToDisk: true,
			title: 'landing',
			data: projectData,
			filename: path.resolve( __dirname, `dist/${ projectData.projectname}/landing/index.html`)

		})

	];

	Object.keys( projectData.sizes ).forEach( (size) => {

		let t = {};

		t.template = path.resolve( __dirname, `src/projects/${ projectData.projectname }/${ size }/index.hbs`);
		t.chunks = [ `${size}` ];
		t.inject = true;
		t.alwaysWriteToDisk = true;
		t.title = `${size}`;
		t.filename = path.resolve( __dirname, `dist/${ projectData.projectname }/${ size }/index.html`);

		html.push( 
			new HtmlWebpackPlugin(t) 
		)

	});

	return html;
	
}

let getEntries = () => { // https://webpack.js.org/concepts/entry-points/#multi-page-application

	let projectEntries = {
		landing: `./src/landing/script.js`
	};

	Object.keys( projectData.sizes ).forEach( (size) => {
		projectEntries[ size ] = `./src/projects/${ projectData.projectname }/${ size }/script.js`;
	});

	return projectEntries;

};

plugins = plugins.concat( // combine plugins // https://webpack.js.org/concepts/plugins/

	[ 
		new CleanWebpackPlugin( path.resolve( __dirname, 'dist' ) ) 
	],
		getHTML(),
	[
		new HtmlWebpackHarddiskPlugin()
	]

);

module.exports = {

	// https://webpack.js.org/configuration/devtool/
	// This option controls if and how source maps are generated.
	devtool: 'cheap-eval-source-map', 

	entry: getEntries(),

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
				test: /\.css$/,
				use: [
					"style-loader",
					"css-loader"
					// Please note we are not running postcss here
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

	plugins: plugins,

	output: {
		path: path.join( __dirname, `dist/${ projectData.projectname }/scripts` ),
		publicPath: '../scripts'
	},

	devServer: {
		contentBase: `dist/${ projectData.projectname }`,
		writeToDisk: true,
		publicPath: `/`,
		port: 9000
	}

};