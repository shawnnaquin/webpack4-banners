const path = require('path');
var zip = require('bestzip');
// project data
const yaml = require('js-yaml');
const fse = require('fs-extra');
const projectConfig = fse.readFileSync( path.resolve( __dirname, 'projectconfig.yml'),'utf8');
const projectData = yaml.load( projectConfig );
projectData.version = require('./package.json').version;

fse.ensureDir( path.resolve( __dirname, 'dist/zip' ) ).then( ()=> {

	let p = [];

	Object.keys( projectData.sizes ).forEach( (size) => {

		p.push(
			new Promise( (res, rej) => {
				zip(
					{
						source: '*',
						destination: `../zip/${size}-${ projectData.projectname}-${ projectData.version }.zip`,
						cwd: path.resolve( __dirname, `dist/${ size }`)
					}
				).then( ()=> {
					res( `${ size } - done!` );
					console.log('!');
				}).catch( (err) => {
					console.error(err.stack);
					rej( `${ size } - failed! ${ err.stack }` );
				});
			}),
		)

	});

	Promise.all(p).then( ()=> {
		zip(
			{
				source: '*',
				destination: `../zip/all-${ projectData.projectname}-${ projectData.version }.zip`,
				cwd: path.resolve( __dirname, `dist/zip`)
			}
		).then( ()=> {
			console.log('done');
		}).catch( (err) => {
			console.error(err.stack);
		});
	});

});



