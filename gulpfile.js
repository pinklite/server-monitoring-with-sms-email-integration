var
  gulp = require('gulp'),
  compass = require('gulp-compass'),
  minifyCSS = require('gulp-minify-css'),
  imagemin = require('gulp-imagemin'),
  concat = require('gulp-concat'),
  fileinclude = require('gulp-file-include'),
  googleWebFonts = require('gulp-google-webfonts'),
  server = require('gulp-server-livereload'),
  rimraf = require('rimraf'),
  connect = require('gulp-connect'),
  templateCache = require('gulp-angular-templatecache');

// path configs
var paths = {
  sass: './src/assets/scss/*.scss',
  js: './src/assets/javascripts/*.js',
  html: 'src/*.html',
  images: ['src/assets/images/*', 'src/assets/images/**/*', 'src/assets/images/icons/*']
}

gulp.task('default', ['html', 'compass', 'images', 'fonts']);

// copy htmls to dist
gulp.task('html', () =>{
  gulp.src([paths.html, '!src/_*.html'])
    .pipe(fileinclude())
    .pipe(gulp.dest('./dist'))


  gulp.src(['./src/templates/*.html', '!src/templates/_*.html'])
    .pipe(fileinclude())
    .pipe(gulp.dest('./dist/templates'))
})


// copy i18n to dist
gulp.task('i18n', () =>{
  gulp.src('./src/assets/i18n/**.js')
    .pipe(fileinclude())
    .pipe(gulp.dest('./dist/assets/i18n'))
})

// css compass task
gulp.task('compass', () =>{
  gulp.src(paths.sass)
    .pipe(compass({
      css: 'src/assets/css',
      sass: 'src/assets/scss',
      image: 'src/assets/images'
    }))
    .pipe(minifyCSS())
    .pipe(concat('main.css'))
    .pipe(gulp.dest('./dist/assets/css'))
    .on('end', function(){

      gulp.src(['./src/assets/vendors/**/*.css', './src/assets/vendors/*.css', './dist/assets/css/*'])
        .pipe(concat('main.css'))
        .pipe(gulp.dest('./dist/assets/css'))

      // remove temporary created src/assets/css
      rimraf.sync('src/assets/css', {});

    })
})


// javascript
gulp.task('js', () =>{
  gulp.src(['./src/assets/javascripts/angular*.js', './src/assets/javascripts/*.min.js', './src/assets/javascripts/app.controller.js', paths.js, './src/assets/vendors/**/*.min.js'])
    .pipe(concat('main.js'))
    .pipe(gulp.dest('./dist/assets/javascripts'))
    .on('end', function(){
      gulp.src(['./dist/templates/*.html', '!dist/templates/_*.html'])
        .pipe(templateCache())
        .pipe(gulp.dest('./dist/assets/javascripts'))
        .on('end', function(){
          gulp.src(['./dist/assets/javascripts/main.js', './dist/assets/javascripts/templates.js'])
            .pipe(concat('main.js'))
            .pipe(gulp.dest('./dist/assets/javascripts'))
        })
    })
})

// fonts
gulp.task('fonts', () => {
	gulp.src('./src/assets/fonts.list')
		.pipe(googleWebFonts())
		.pipe(gulp.dest('./src/assets/fonts'))
    .on('end', function(){
      gulp.src('./src/assets/fonts/*').pipe(gulp.dest('./dist/assets/fonts'))
    })

})

// image opt
gulp.task('images', () =>
    gulp.src(paths.images, {base: './src/assets/images'})
        .pipe(imagemin())
        .pipe(gulp.dest('dist/assets/images'))
);

// rerun the task when a file changes
gulp.task('watch', () => {
  gulp.watch([paths.sass, './src/assets/scss/partials/*.scss'], ['compass']);
  gulp.watch([paths.html, './src/templates/*.html'], ['html', 'js']);
  gulp.watch(paths.js, ['js']);
  gulp.watch('./src/assets/i18n/*.json', ['i18n']);
  gulp.watch(paths.images, ['images']);
});

gulp.task('webserver', () => {
  connect.server({
    root: './dist',
    port: 8000,
    livereload: true
  });
});
