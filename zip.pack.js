const path = require('path');
var zip = require('bestzip');
// project data
const yaml = require('js-yaml');
const fse = require('fs-extra');
const projectConfig = fse.readFileSync( path.resolve( __dirname, 'projectconfig.yml'),'utf8');
const projectData = yaml.load( projectConfig );

let clean = new Promise( (res, rej) => {

	fse.emptyDir( path.resolve( __dirname, 'zip'), err => {
	  if (err) {
	  	rej(err);
	  } else {
	  	res('cleaned zips');
	  }
	});

}).then( ()=> {

	let p = [];

	Object.keys( projectData.sizes ).forEach( (size) => {

		p.push(
			new Promise( (res, rej) => {
				zip(
					{
						source: '*',
						destination: path.resolve( __dirname, `zip/${size}-${ projectData.projectname}.zip`),
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
		console.log('done');
	});

});



