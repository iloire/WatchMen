var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var mainBowerFiles = require('main-bower-files');
var del = require('del');
var runSequence = require('run-sequence');

function js(shouldMinify) {
  return gulp.src(mainBowerFiles().concat([ // not taking wildcards
    './webserver/public/js/controllers/**',
    './webserver/public/js/charting/**',
    './webserver/public/js/directives/**',
    './webserver/public/js/**'
  ]))
      .pipe(plugins.filter('**/*.js'))
	  .pipe(plugins.sourcemaps.init())
      .pipe(plugins.concat('scripts.js'))
      .pipe(plugins.if(shouldMinify, plugins.ngAnnotate()))
      .pipe(plugins.if(shouldMinify, plugins.uglify()))
	  .pipe(plugins.sourcemaps.write())
      .pipe(gulp.dest('./webserver/public/build'));
}

function css(shouldMinify) {
  return gulp.src(mainBowerFiles().concat(['./webserver/public/less/main.less']))
      .pipe(plugins.filter('**/*.+(less|css)')) //css
	  .pipe(plugins.sourcemaps.init())
	  .pipe(plugins.less())
      .pipe(plugins.concat('style.css'))
      .pipe(plugins.if(shouldMinify, plugins.cleanCss({keepBreaks: true})))
	  .pipe(plugins.sourcemaps.write())
      .pipe(gulp.dest('./webserver/public/build'));
}

gulp.task('clean', function () {
  return del([
    './webserver/public/build/*',
    './webserver/public/fonts/*'
  ]);
});

gulp.task('copy-fonts', function () {
  return gulp.src('./webserver/public/bower_components/bootstrap/fonts/*')
      .pipe(plugins.copy('./webserver/public/fonts/', {prefix: 5}));
});

gulp.task('lint', function () {
  return gulp.src([
    './webserver/**/*.js',
    '!./webserver/public/bower_components/**/*.js',
    '!./webserver/public/build/**/*.js',
    './lib/**/*.js',
    './test/**/*.js',
    './config/**/*.js',
    './scripts/**/*.js',
    './*.js'
  ])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

gulp.task('js-dev', function () {
  return js(false);
});

gulp.task('js-prod', function () {
  return js(true);
});

gulp.task('css-prod', function () {
  return css(true);
});

gulp.task('build', function () {
  return runSequence('clean', ['copy-fonts', 'js-prod', 'css-prod']);
});

gulp.task('watch', function () {
  gulp.watch('./webserver/public/bower_components/**/*', ['css-prod', 'js-dev']);
  gulp.watch('./webserver/public/js/**', ['js-dev']);
  gulp.watch('./webserver/public/less/*', ['css-prod']);
});

gulp.task('default', ['build']);