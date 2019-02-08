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

let plugins = [];

let getHTML = () => {

	let html = [

		new HtmlWebpackPlugin({

			template: path.resolve( __dirname, `src/landing/index.hbs`),
			chunks: [ 'landing' ],
			hash: true,
			inject: true,
			alwaysWriteToDisk: true,
			minify: {
                    collapseWhitespace: true
                },
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
		t.minify = {
                    collapseWhitespace: true
                };
		t.alwaysWriteToDisk = true;
		t.title = `${size}`;
		t.filename = path.resolve( __dirname, `dist/${ projectData.projectname }/${ size }/index.html`);

		html.push(
			new HtmlWebpackPlugin(t)
		)

	});

	return html;

}

plugins = plugins.concat( // combine plugins // https://webpack.js.org/concepts/plugins/

	[
		new CleanWebpackPlugin( path.resolve( __dirname, 'dist' ) )
	],
		getHTML(),
	[
		new HtmlWebpackHarddiskPlugin(),
		new MiniCssExtractPlugin({
		  filename: "[name]/style.css"
		}),
		new CopyWebpackPlugin( [ {
			from: path.resolve( __dirname, 'src/index.html'),
			to: path.resolve( __dirname, `dist/${ projectData.projectname }/index.html`)
		} ] )
	]

);

let getEntries = () => { // https://webpack.js.org/concepts/entry-points/#multi-page-application

	let projectEntries = {
		landing: `./src/landing/script.js`
	};

	Object.keys( projectData.sizes ).forEach( (size) => {
		projectEntries[ size ] = `./src/projects/${ projectData.projectname }/${ size }/script.js`;
	});

	return projectEntries;

};

let getAlias = ()=> {

	let a = {
		'@src': path.resolve( __dirname, 'src/'),
		'@sizmek': path.resolve( __dirname, 'src/shared/sizmek/'),
		'@project': path.resolve( __dirname, `src/projects/${ projectData.projectname }/`)
	};

	Object.keys( projectData.sizes ).forEach( (size)=> {
		a[`@${size}`] = path.resolve( __dirname, `src/projects/${ projectData.projectname }/${ size }/` )
	});

	return a;

};


// Extracting CSS based on entry
// https://webpack.js.org/plugins/mini-css-extract-plugin/#Extracting%20CSS%20based%20on%20entry

let recursiveIssuer = (m) => {
  if (m.issuer) {
    return recursiveIssuer(m.issuer);
  } else if (m.name) {
    return m.name;
  } else {
    return false;
  }
};

let getCacheGroups = ()=> {

	let t = {
		'landingStyles': {
			name: 'landing',
			test: (m,c,entry = 'foo') => m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry,
			chunks: 'all',
			enforce: true
		}
	};

	Object.keys( projectData.sizes ).forEach( (size)=> {
		t[`${size}Styles`] = {
			name: size,
			test: (m,c,entry = 'foo') => m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry,
			chunks: 'all',
			enforce: true
		};
	});

	return t;

};

module.exports = {

	mode: 'production',
	// https://webpack.js.org/configuration/devtool/
	// This option controls if and how source maps are generated.
	devtool: false,

	optimization: {
	  splitChunks: {
	    cacheGroups: getCacheGroups()
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

	plugins: plugins,

	output: {
		path: path.join( __dirname, `dist/${ projectData.projectname }` ),
		publicPath: '../',
		filename: '[name]/index.js'
	},

	resolve: {
		alias: getAlias()
	}

};