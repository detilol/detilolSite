/* jshint camelcase: false */
'use strict';

var gulp = require('gulp'),
    gutil = require('gulp-util'),
    prefix = require('gulp-autoprefixer'),
    minifyCss = require('gulp-minify-css'),    
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    gulpIf = require('gulp-if'),
    htmlmin = require('gulp-htmlmin'),
    ngConstant = require('gulp-ng-constant'),
    rename = require("gulp-rename"),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    rev = require('gulp-rev'),
    concat = require('gulp-concat'),
    proxy = require('proxy-middleware'),
    es = require('event-stream'),
    del = require('del'),
    url = require('url'),
    wiredep = require('wiredep'),
    inject = require('gulp-inject'),
    fs = require('fs'),
    cdnizer = require('gulp-cdnizer'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync'),
    
    karma = require('karma'),
    
    //photobank = require('./config/photobank.js'),
    //glwip = require('gulp-lwip'),
	//lwip = require('lwip'),
	//glob = require('glob'),
	im = require('node-imagemagick');


var yeoman = {
    app: 'site/',
    dist: 'dist/',
    test: 'test/javascript/spec/',
    tmp: '.tmp/',
    importPath: 'bower_components',
    scss: 'site/scss/',
    port: 9000,
    apiPort: 8080,
    liveReloadPort: 35729,
    bootswatchTheme: 'cerulean'
};

var mode = 'dev';

var bowerrcS;
try{
	bowerrcS = fs.readFileSync('.bowerrc', 'utf8');	
}catch(e){
	gutil.log('File', gutil.colors.magenta('.bowerrc'), 'is not found. Considering', gutil.colors.magenta('bower_components'), 'as bower repo.');
}
var bowerDir = (!bowerrcS)?'bower_components':JSON.parse(bowerrcS).directory;
var bowerDir = bowerDir || 'bower_components';

//////////// TASKS///////////
gulp.task('clean', function (cb) {
	  del([yeoman.dist], cb);
});
gulp.task('clean:tmp', function (cb) {
	  del([yeoman.tmp], cb);
});

gulp.task('copy', function(){
	return runSequence('copy:root', 'copy:img', 'copy:html');
});
gulp.task('copy:img', function(){
	return gulp.src([yeoman.app+'img/**']).
            pipe(gulp.dest(yeoman.dist+'img'));          
});
gulp.task('copy:html', function(){
	return gulp.src([yeoman.app+'**/*.html']).pipe(gulp.dest(yeoman.dist));
});
gulp.task('copy:js', function(){
	var appjs = gulp.src([yeoman.app+'js/main.js']).pipe(gulp.dest(yeoman.dist+'assets/js'));
	var auxiliary = gulp.src([yeoman.app+'js/assets/*.js', '!'+yeoman.app+'**/*_test.js'])
		//.pipe(plugins.ignore('./client/app.js')) .pipe(filterOut)
		.pipe(gulp.dest(yeoman.dist+'assets/js/assets'));
	
	var mergeJs = gulp.src([ yeoman.dist+'assets/js/main.js', yeoman.dist+'assets/js/assets/*.js'])
		.pipe(concat('app.js'))
		.pipe(gulp.dest(yeoman.dist+'scripts'));

	return es.merge(appjs, auxiliary, mergeJs);
});

gulp.task('copy:js:min', function(){
	var appjs = gulp.src([yeoman.app+'js/main.js']);//.pipe(gulp.dest(yeoman.dist+'assets/js'));
	var auxiliary = gulp.src([yeoman.app+'js/assets/*.js', '!'+yeoman.app+'**/*_test.js']);
		//.pipe(plugins.ignore('./client/app.js')) .pipe(filterOut)
		//.pipe(gulp.dest(yeoman.dist+'assets/js/assets'));
	return es.merge(appjs, auxiliary)
	  .pipe(concat('app.min.js'))
	  .pipe(gulp.dest(yeoman.dist+'scripts'));
	
	/*
	var mergeMinJs = gulp.src([ yeoman.dist+'assets/js/main.js', yeoman.dist+'assets/js/assets/*.js'])
		.pipe(concat('app.min.js'))
		//.pipe(uglify())
		.pipe(gulp.dest(yeoman.dist+'scripts'));
	
	return es.concat(appjs, auxiliary, mergeMinJs);
	*/
});
/** copy all except *.html, img and js */
gulp.task('copy:root', function(){
	return gulp.src(['!'+yeoman.app+'{js,img}/**', '!'+yeoman.app+'*.html', yeoman.app+'**']).pipe(gulp.dest(yeoman.dist));
});

gulp.task('update:index', function() {
    return es.merge(gulp.src(yeoman.app+'index.html').pipe(gulp.dest(yeoman.dist)));
});
gulp.task('update:js', function() {
    return es.merge(gulp.src(yeoman.app+'**/*.js').pipe(gulp.dest(yeoman.dist)));
});

/** Compiles Sass */
gulp.task('sass', function () {
	// Sass will check these folders for files when you use @import.
	var bootswatchSass = bowerDir+'/bootswatch/'+yeoman.bootswatchTheme;	
	var customScss = yeoman.app + 'assets/scss';	
	
	var bootswatchSASS = gulp.src(yeoman.app+'assets/vendor/scss/bootswatch.scss')
		//.pipe(wiredep.stream({devDependencies:true}))
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle:'nested', includePaths: [bowerDir], errLogToConsole:true}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulpIf(['*.css', '!*.map'], autoprefixer({browsers: ['last 2 versions', 'ie 10']})))
		.pipe(gulp.dest(yeoman.dist+'assets/vendor/css'));
	
	var fontawesomeSASS = gulp.src(yeoman.app+'assets/vendor/scss/font-awesome.scss')
		//.pipe(wiredep.stream({
		//	devDependencies:true//,
			//exclude: [/bootstrap-sass\/assets\/stylesheets/] //exclude bootstrap - include it directly in vendors.scss -> _bootswatch.scss
		//}))
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle:'nested', includePaths:[bowerDir], errLogToConsole:true}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulpIf(['*.css', '!*.map'], autoprefixer({browsers: ['last 2 versions', 'ie 10']})))
		.pipe(gulp.dest(yeoman.dist+'assets/vendor/css'));
	//to use sourcmaps+autoprefixer see http://blaipratdesaba.com/gulp-sass-autoprefixer-and-sourcemaps-status/
	//use autoprefixer+sourcemaps with compressed only outputStyle or put autoprefixer after sourcemap write
	var normalSASS = gulp.src(yeoman.app+'assets/scss/app.scss')	
		.pipe(sourcemaps.init())
		.pipe(sass({
			sourceComments: 'normal',
			includePaths: [customScss, bootswatchSass, bowerDir],
			outputStyle: 'nested',
			errLogToConsole: true
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulpIf(['*.css', '!*.map'], autoprefixer({browsers: ['last 2 versions', 'ie 10']})))		
		.pipe(gulp.dest(yeoman.dist+'css/'));
	
	/*
	var minSASS = gulp.src(yeoman.app+'assets/scss/app.scss')
		.pipe(sass({
			includePaths: [customScss, bootswatchSass, bowerDir],
			outputStyle: 'compressed',
			errLogToConsole: true
		}))
		.pipe(autoprefixer({browsers: ['last 2 versions', 'ie 10']}))
		.pipe(rename('app.min.css'))
		.pipe(gulp.dest(yeoman.dist+'css/'));
	*/
	var glyphiconsFontCopy = gulp.src(bowerDir+'/bootstrap-sass/assets/fonts/bootstrap/*').pipe(gulp.dest(yeoman.dist+'assets/vendor/fonts/bootstrap'));
	var fontawesometCopy = gulp.src(bowerDir+'/font-awesome/fonts/*').pipe(gulp.dest(yeoman.dist+'assets/vendor/fonts'));
	
	return es.concat(normalSASS, bootswatchSASS, fontawesomeSASS, glyphiconsFontCopy, fontawesometCopy);
});
gulp.task('styles', ['sass'], function() {
	gutil.log(gutil.colors.magenta('SASS processed!'));
});

/** Puts bower dependencies to assets/vendor folder */
gulp.task('vendor', function(){
	var wiredepJs = gulp.src(wiredep().js).pipe(gulp.dest(yeoman.dist+'/assets/vendor/js/'));
	var wiredepCss = gulp.src(wiredep().css).pipe(gulp.dest(yeoman.dist+'/assets/vendor/css/'));
	//var leafletImages = gulp.src(bowerDir+'/leaflet/dist/images/*').pipe(gulp.dest(yeoman.dist+'/assets/vendor/css/images'));
	return es.concat(wiredepJs, wiredepCss);//, leafletImages);
});

gulp.task('jshint', function() {
    return gulp.src(['gulpfile.js', yeoman.app + 'scripts/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('serve:dev', ['build:dev'], function(){
	//tunnel:detilol == http://detilol.localtunnel.me
	browserSync({
        open: false, //'local',
        //browser: ['firefox'],        
        //tunnel: true,
        port: yeoman.port,
        server: {
            baseDir: yeoman.dist
        }		
    });
	//gulp.run('watch');
	watcher('dev');
});
gulp.task('serve:prod', ['build:prod'], function(){
	browserSync({
        open: false,
        port: yeoman.port,
        server: {
            baseDir: yeoman.dist
        }
    });
	//gulp.run('watch');
	//watcher('prod');
});

function watcher(serveMode){
	mode = serveMode;
	//gulp.watch('bower.json', ['wiredep:test', 'wiredep:'+serveMode]);
    gulp.watch('gulpfile.js', ['ngconstant:'+serveMode]);
    gulp.watch(yeoman.app + '**/*.js').on('change', watchJs);
    gulp.watch(yeoman.app + 'assets/scss/**/*.scss', ['styles']);
    gulp.watch(yeoman.dist + 'css/**/*.css').on('change', browserSync.reload);
    //gulp.watch(yeoman.app + 'assets/images/**', ['images']);
    gulp.watch([yeoman.app + 'partials/**/*.html', yeoman.app + 'templates/**/*.html'], ['copy:html']);
    gulp.watch([yeoman.dist+ 'partials/**/*.html', yeoman.dist + 'templates/**/*.html'],['wiredep:'+mode]);
    gulp.watch([yeoman.app + 'index.html']).on('change', watchIndex);
}
function watchIndex(){
	runSequence('update:index', 'wiredep:'+mode);
}
function watchJs(){
	runSequence('update:js', 'wiredep:'+mode);
}

/** Inserts vendor libs in index.html in DEV mode */
gulp.task('wiredep:dev', function (){
	var excludeVendors = ['bootstrap-sass', 'jquery'];
	var wiredepConfig = {
		exclude: excludeVendors,
		fileTypes:{
			html:{
				replace:{
					js:function(filePath){
						return '<script src="' + 'assets/vendor/js/' + filePath.split('/').pop() + '"></script>';
					},
					css:function(filePath){
						return '<link rel="stylesheet" href="' + 'assets/vendor/css/' + filePath.split('/').pop() + '" />';
					}
				}
			}
		}
	};
	var injectScriptConfig = {
        addRootSlash: false,
        transform: function(filePath, file, i, length) {
          return '<script src="' + filePath.replace(yeoman.dist, '') + '"></script>';
		}
	};
	var injectCSSConfig = {
        addRootSlash: false,
        transform: function(filePath, file, i, length) {
          return '<link rel="stylesheet" href="' + filePath.replace(yeoman.dist, '') + '"/>';
        }
    };
	return gulp.src(yeoman.dist+'index.html')
		.pipe(wiredep.stream(wiredepConfig))
		.pipe(inject(
			gulp.src([
			          yeoman.dist+'assets/js/main.js',
			          yeoman.dist+'scripts/app.constants.js', 
			          yeoman.dist+'assets/js/assets/**'
			          ], {read:false}),
			injectScriptConfig
		))
		.pipe(inject(
			gulp.src([yeoman.dist+'assets/vendor/css/bootswatch.css', yeoman.dist+'assets/vendor/css/font-awesome.css', yeoman.dist+'css/app.css'], { read: false }),
			injectCSSConfig
		))
		.pipe(gulp.dest(yeoman.dist))		
		.pipe(browserSync.reload({stream: true}));
});
// In PROD mode exclude libs already included in foundation-apps at CDN, as FA itself is to be cdnized
gulp.task('wiredep:prod', function (){
	var excludeVendors = ['bootstrap-sass', 'jquery'];
	var wiredepConfig = {		
		exclude: excludeVendors,
		fileTypes:{
			html:{
				replace:{
					js:function(filePath){
						return '<script src="' + 'assets/vendor/js/' + filePath.split('/').pop() + '"></script>';
					},
					css: function(filePath) {
						return '<link rel="stylesheet" href="' + 'assets/vendor/css/' + filePath.split('/').pop() + '"/>';
					}
				}
			}
		}
	};
	var injectScriptConfig = {
        addRootSlash: false,
        transform: function(filePath, file, i, length) {
          return '<script src="' + filePath.replace(yeoman.dist, '') + '"></script>';
		}
	};
	var injectCSSConfig = {
        addRootSlash: false,
        transform: function(filePath, file, i, length) {
          return '<link rel="stylesheet" href="' + filePath.replace(yeoman.dist, '') + '"/>';
        }
    };
	return gulp.src(yeoman.dist+'index.html')
		.pipe(wiredep.stream(wiredepConfig))
		.pipe(inject(
			gulp.src([yeoman.dist+'scripts/app.min.js', yeoman.dist+'scripts/app.constants.js'], { read: false }),
			injectScriptConfig
		))
		.pipe(inject(
			gulp.src([yeoman.dist+'assets/vendor/css/bootswatch.css', yeoman.dist+'assets/vendor/css/font-awesome.css', yeoman.dist+'css/app.css'], { read: false }),
			injectCSSConfig
		))
		.pipe(gulp.dest(yeoman.dist))
		.pipe(rename('404.html'))
		.pipe(gulp.dest(yeoman.dist));
});
gulp.task('cdnizer', function(){
	return gulp.src(yeoman.dist+'/index.html')
		.pipe(cdnizer([			
			{
				file: 'assets/vendor/js/angular.js',
				package: 'angular',
				cdn: '//cdn.jsdelivr.net/angularjs/${version}/${filenameMin}'
			},
			{
				file: 'assets/vendor/js/angular-animate.js',
				package: 'angular-animate',
				cdn: '//cdn.jsdelivr.net/angularjs/${version}/${filenameMin}'
			},			
			{
				file: 'assets/vendor/js/ui-bootstrap-tpls.js',
				package: 'angular-bootstrap',
				cdn: '//cdn.jsdelivr.net/angular.bootstrap/${version}/${filenameMin}'
			},			
			{
				file: 'assets/vendor/js/angular-ui-router.js',
				package: 'angular-ui-router',
				cdn: '//cdn.jsdelivr.net/angular.ui-router/${version}/${filenameMin}'
			},			
			{
				file: 'assets/vendor/css/bootswatch.css',
				package: 'bootswatch',
				cdn: '//cdn.jsdelivr.net/bootswatch/${version}/'+yeoman.bootswatchTheme+'/bootstrap.min.css'
			},
			{
				file: 'assets/vendor/css/font-awesome.css',
				package: 'font-awesome',
				cdn: '//cdn.jsdelivr.net/fontawesome/${version}/css/${filenameMin}'
			},
			{
				file: 'assets/vendor/js/leaflet.js',
				package: 'leaflet',
				cdn: '//cdn.jsdelivr.net/leaflet/${version}/${filename}'
			},
			{
				file: 'assets/vendor/css/leaflet.css',
				package: 'leaflet',
				cdn: '//cdn.jsdelivr.net/leaflet/${version}/leaflet.css'
			}
		]))
		.pipe(gulp.dest(yeoman.dist));
});
/** Builds development distribution (DEV mode)*/
gulp.task('build:dev', function () {
    runSequence('ngconstant:dev', 'copy', 'copy:js', 'vendor', 'styles', 'wiredep:dev', 'photobank');
});
/** Builds production distribution (PROD mode)*/
gulp.task('build:prod', function () {
    runSequence( 'ngconstant:prod', 'copy', 'copy:js:min', 'vendor', 'styles', 'wiredep:prod', 'cdnizer', 'photobank');
});
/////////////////////Photobank/////////////////
function processImages(files, index){
	index = index || 0;
	if(index>files.length-1) return;
	console.log('processing index ', index);
	var file = files[index];
	
	im.readMetadata(file, function(err, metadata){
		  if (err) throw err;
		  console.log('Shot at '+metadata.exif.dateTimeOriginal);
		  processImages(files, ++index);
	});
	
	
		/*
	var buffer = fs.readFileSync(file);	
	
	lwip.open(buffer, 'jpg', function(err, image) {
		  if (err) throw err;
		  if(image==null) throw 'Image is null';
		  var saveFile = yeoman.dist+file;
		  console.log('Save to ', saveFile);
		  image = null, buffer=null;
		  //image.crop(200, 200, function(err, image){
			//image.toBuffer('jpg', function(err, buffer){
				  processImages(files, ++index); 
				  //fs.writeFile(saveFile, buffer, {encoding:'binary'}, function(){
	            	//  processImages(files, ++index); 
	              //});			  
			//}); 
		  //}); 
	});
	
	*/
}
gulp.task('photobank', function(){
	//gutil.log('Photobank - my personal Node module : ', gutil.colors.magenta(photobank.getSize('./photobank/DSC_2186.JPG')));
	var photobankDir = yeoman.dist+'photobank/';
	var photobankThumb = photobankDir+'thumbnails/';
	if (!fs.existsSync(photobankDir)){
		fs.mkdirSync(photobankDir);
	}
	if (!fs.existsSync(photobankThumb)){
		fs.mkdirSync(photobankThumb);
	}
	
	im.convert(['photobank/*.jpg', '-thumbnail', '400x300', '-quality', '80', photobankThumb+'thumb.jpg'], 
			function(err, stdout){
		  		if (err) throw err;
			}
	);
	
});
//////////////////Inject CONSTANTS in Angular module//////////////////
/** Generates Angular application's constants in PROD mode */
gulp.task('ngconstant:prod', function() {
	return gulp.src('./config/ng-const-config.prod.json')
		.pipe(ngConstant())
		.pipe(rename('app.constants.js'))
		.pipe(gulp.dest(yeoman.dist+'scripts'));
});
/** Generates Angular application's constants in DEV mode */
gulp.task('ngconstant:dev', function() {
	return gulp.src('./config/ng-const-config.dev.json')
		.pipe(ngConstant())
		.pipe(rename('app.constants.js'))
		.pipe(gulp.dest(yeoman.dist+'scripts'));
});

gulp.task('server', ['serve:dev'], function () {
    gutil.log('The `server` task has been deprecated. Use `gulp serve` to start a server');
});

gulp.task('unit-test', function (done) {
	var testFiles = [	         
			{pattern:yeoman.dist+'/assets/vendor/js/angular.js',watched:false},
			{pattern:yeoman.dist+'/assets/vendor/js/angular-animate.js',watched:false},
			{pattern:yeoman.dist+'/assets/vendor/js/angular-ui-router.js',watched:false},
			{pattern:yeoman.dist+'/assets/vendor/js/leaflet.js',watched:false},
			{pattern:yeoman.dist+'/assets/vendor/js/ui-bootstrap-tpls.js',watched:false},
			{pattern:bowerDir+'/angular-mocks/angular-mocks.js', watched:false},			
			{pattern:'node_modules/chai/chai.js', watched:false},
			{pattern:yeoman.app+'/js/main.js'},
			{pattern:yeoman.app+'/js/assets/**.js'}			
			//jasmine-jquery {pattern: yeoman.app+'/data/*.json', watched: true, served: true, included: false}
		];
		
		function karmaServerCb(exitCode){
			gutil.log('Karma has exited with ' + gutil.colors.red(exitCode));
			process.exit(exitCode);
		}
	
	
		var Server = karma.Server;		
	    var testServer = new Server({
		    	configFile:__dirname + '/karma.conf.js',
		    	singleRun: true,
		    	client:{
		    		captureConsole:true
		    	},
		    	//browsers: ['Chrome'],
		    	reporters: ['spec', 'coverage'],
		    	//reporters: ['progress', 'coverage'],
		    	//preprocessors: {
				      // source files you wanna generate coverage for
				      // do not include tests or libraries (these files will be instrumented by Istanbul)
				//	'site/**/!(*_test).js': 'coverage'
				//},
		    	files: testFiles
		    }, karmaServerCb); // for error handling with .on('error', function(){}) - use github.com/lazd/gulp-karma
	    testServer.start();
});

gulp.task('default', function() {
    runSequence('test', 'build:prod');
});