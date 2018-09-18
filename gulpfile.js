var	gulp                   = require('gulp'),
	gutil                  = require('gulp-util' ),
	sass                   = require('gulp-sass'),
	browserSync            = require('browser-sync'),
	concat                 = require('gulp-concat'),
	uglify                 = require('gulp-uglify'),
	cleanCSS               = require('gulp-clean-css'),
	rename                 = require('gulp-rename'),
	del                    = require('del'),
	imagemin               = require('gulp-imagemin'),
	imageminJpegRecompress = require('imagemin-jpeg-recompress'),
	pngquant               = require('imagemin-pngquant'),
	cache                  = require('gulp-cache'),
	autoprefixer           = require('gulp-autoprefixer'),
	notify                 = require("gulp-notify"),
	rsync                  = require('gulp-rsync'),
	gcmq                   = require('gulp-group-css-media-queries'),
	rigger                 = require('gulp-rigger'),
	smartgrid              = require('smart-grid'),
	uncss                  = require('gulp-uncss'),
	replaceName            = require('gulp-replace-name'),
	csscomb                = require('gulp-csscomb');

gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'app'
		},
		notify: false,
		// tunnel: true,
		// tunnel: "demohtml"
	});
});

gulp.task('sass', function() {
	return gulp.src('app/template/sass/**/*.sass')
	.pipe(sass({outputStyle: 'expand'}).on("error", notify.onError()))
	.pipe(autoprefixer(['last 15 versions']))
	.pipe(gcmq()) //группировка медиа-запросов
	.pipe(csscomb())
	.pipe(gulp.dest('app/template/css'))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('css', function() {
	return gulp.src('app/template/css/**/*.css')
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('js', function() {
	return gulp.src('app/template/js/**/*.js')
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('html-part', function() {
	gulp.src('app/chunk.*.html')
	.pipe(rigger())
	.pipe(browserSync.reload({stream: true}));

	gulp.src('app/*.tpl.html')
	.pipe(rigger())
	.pipe(replaceName(/\.tpl/g, ''))
	.pipe(gulp.dest('app'))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('watch', ['sass', 'css', 'browser-sync', 'html-part'], function() {
	gulp.watch('app/template/sass/**/*.sass', ['sass']);
	gulp.watch('app/template/css/**/*.css', ['css']);
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['js']);
	gulp.watch('app/*.html', ['html-part']);
});

gulp.task('default', ['watch']);

gulp.task('smartgrid', function() {
	var settings = {
		outputStyle: 'sass', /* less || scss || sass || styl */
		columns: 12, /* number of grid columns */
		offset: '15px', /* gutter width px || % */
		mobileFirst: false, /* mobileFirst ? 'min-width' : 'max-width' */
		container: {
			maxWidth: '1284px', /* max-width оn very large screen */
			fields: '15px' /* side fields */
		},
		breakPoints: {
			lg: {
				width: '1100px', /* -> @media (max-width: 1100px) */
			},
			md: {
				width: '960px'
			},
			sm: {
				width: '780px',
				fields: '15px' /* set fields only if you want to change container.fields */
			},
			xs: {
				width: '480px'
			}
		}
	};
	smartgrid('app/template/sass', settings);
});


gulp.task('images', function() {
	gulp.src('app/template/img/**/*')
	.pipe(cache(imagemin([
		imagemin.gifsicle({interlaced: true}),
		imagemin.jpegtran({progressive: true}),
		imageminJpegRecompress({
			loops: 5,
			min: 60,
			max: 65,
			quality:'medium'
		}),
		imagemin.svgo(),
		imagemin.optipng({optimizationLevel: 7}),
		pngquant({quality: '60-65', speed: 3})
		],{
			verbose: true
		})))
	.pipe(gulp.dest('app/template/img'));

	cache.clearAll(); 
});

gulp.task('remove', function() { return del.sync('app/build'); });

gulp.task('build', ['remove', 'images'], function(){

	var html = gulp.src('app/*.tpl.html')
		.pipe(rigger())
		.pipe(replaceName(/\.tpl/g, ''))
		.pipe(gulp.dest('app/build/'));

	var html_chunks = gulp.src('app/*.tpl.html')
		.pipe(gulp.dest('app/build/'));

	var images = gulp.src('app/template/img/**/*')
		.pipe(gulp.dest('app/build/template/img'));

	var fonts = gulp.src('app/template/fonts/**/*')
		.pipe(gulp.dest('app/build/template/fonts'));

	var css = gulp.src('app/template/css/**/*')
		.pipe(gulp.dest('app/build/template/css'));

	var js = gulp.src('app/template/js/**/*')
		.pipe(gulp.dest('app/build/template/js'));
});