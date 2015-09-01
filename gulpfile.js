var gulp = require('gulp'),
    pkg = require('./package.json'),
    browserSync = require('browser-sync'),
    autoprefixer = require('gulp-autoprefixer'),
    minifyCSS = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    imageMin = require('gulp-imagemin'),
    imageMinPngcrush = require('imagemin-pngcrush'),
    imageMinPngquant = require('imagemin-pngquant'),
    cache = require('gulp-cache'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    copy = require('gulp-copy'),
    clean = require('gulp-clean'),
    htmlreplace = require('gulp-html-replace'),
    md5 = require("md5-file"),
    del = require('del'),
    fileutil = require('fileutil');
    runSequence = require('run-sequence');

var date = new Date;
function getDate (){
    var dateArr = [
        date.getFullYear()+'-',
        (date.getMonth()+1)+'-',
        date.getDate()+'_',
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    ];
    for(var i = 0, len = dateArr.length; i < len; i++) {
        var value = dateArr[i];
        if (value < 10) {
            value = '0' + value;
        }
        dateArr[i] = value;
    }
    return dateArr.join('');
}

//打包文件夹根目录
var build = './build/'+ pkg.name + '_build_' + getDate();
//源码根路径 
var base = './juyoulicai_war_exploded/'; 

var cssFilesConfig = [
    {
        name: 'all',
        suffix: '.css',
        dest: build + '/asset/css',
        src: [
            base + 'asset/css/normalize.css',
            base + 'asset/css/layer.css',
            base + 'asset/css/style.css',
            base + 'asset/css/h5.css'
        ]
    }
];
var jsFilesConfig = [
    {
        name: 'all',
        suffix: '.js',
        dest: build + '/asset/js',
        src: [
            base + 'asset/js/libs/zepto.js',
            base + 'asset/js/libs/layer.m.js',
            base + 'asset/js/libs/template.js',
            base + 'asset/js/libs/fastclick.js',
            base + 'asset/js/libs/touch.js'
        ]
    }, {
        name: 'page',
        suffix: '.js',
        dest: build + '/asset/js',
        src: [
            base + 'asset/js/page/main.js'
        ]
    }
];
var imageFilesConfig = [
    {
        dest: build + '/asset/images/banks',
        src: [
            base + 'asset/images/banks/*.{png,jpg,gif,ico}'
        ]
    }, {
        dest: build + '/asset/images/h5',
        src: [
            base + 'asset/images/h5/*.{png,jpg,gif,ico}'
        ]
    }, {
        dest: build + '/asset/images/',
        src: [
            base + 'asset/images/*.{png,jpg,gif,ico}'
        ]
    }
];
var htmlFilesConfig = [
    {
        dest: build + '/',
        src: [
            base + '*.jsp',
            base + '*.html'
        ]
    }, {
        dest: build + '/activity',
        src: [
            base + 'activity/*.jsp',
            base + 'activity/*.html'
        ]
    }, {
        dest: build + '/tpl',
        src: [
            base + 'tpl/*.jsp',
            base + 'tpl/*.html'
        ]
    }
];
gulp.task('server', function () {
	browserSync({
		files: '**',
		server: {
			baseDir: base
		},
		open: "external"
	});
});
var version = {};
gulp.task('clean-css', ['copy'], function () {
    return gulp.src(build + '/asset/css')
               .pipe(clean());
});
gulp.task('clean-js', ['copy'], function () {
    return gulp.src(build + '/asset/js')
               .pipe(clean());
});
gulp.task('cssMin', ['copy', 'clean-css'], function () {
    var tempN = 0;
    var stream;
    cssFilesConfig.forEach(function (config) {
        var temp = build + '/asset/css/temp' + (tempN++);
        stream = gulp.src(config.src)
            .pipe(concat(config.name + config.suffix))
            .pipe(gulp.dest(temp))
            .pipe(autoprefixer({
                browsers: ['last 7 versions'],
                cascade: false
            }))
            .pipe(rename({suffix: '.min'}))
            .pipe(minifyCSS())
            .pipe(gulp.dest(config.dest))
            .on('end', function () {
                del(temp);
                version[config.name + config.suffix] = md5(config.dest + '/' + config.name + '.min' + config.suffix);
            })
            .pipe(notify({title: '提示', message: 'CSS压缩完成'}));
    });
    return stream;
});

gulp.task('jsMin', ['copy', 'clean-js'], function () {
    var tempN = 0;
    var stream;
    jsFilesConfig.forEach(function (config) {
        var temp = build + '/asset/js/temp' + (tempN++);
        stream = gulp.src(config.src)
            .pipe(concat(config.name + config.suffix))
            .pipe(gulp.dest(temp))
            .pipe(rename({suffix: '.min'}))
            .pipe(uglify())
            .pipe(gulp.dest(config.dest))
            .on('end', function () {
                del(temp);
                version[config.name + config.suffix] = md5(config.dest + '/' + config.name + '.min' + config.suffix);
            })
            .pipe(notify({title: '提示', message: 'JS压缩完成'}));
    });
    return stream;
});

gulp.task('imageMin', ['copy'], function () {
    var stream;
    imageFilesConfig.forEach(function (config) {
        stream = gulp.src(config.src)
            .pipe(imageMin({progressive: true, optimizationLevel: 3, use: [imageMinPngquant({quality: '65-80', speed: 4})]}))
            .pipe(gulp.dest(config.dest))
            .pipe(notify({title: '提示', message: '图片压缩成功'}));
    });
    return stream;
});

gulp.task('pathUpdate', function () {
    htmlFilesConfig.forEach(function (config) {
        gulp.src(config.src)
            .pipe(htmlreplace({
                'css': '<%=path%>/asset/css/all.min.css?v=' + version['all.css'],
                'js-page': '<%=path%>/asset/js/page.min.js?v=' + version['page.js'],
                'js': '<%=path%>/asset/js/all.min.js?v=' + version['all.js']

            }))
            .pipe(gulp.dest(config.dest))
            .pipe(notify({title: '提示', message: '资源引用路径修改完成'}));
    })
});

gulp.task('build', ['cssMin', 'jsMin', 'imageMin'], function () {
    gulp.run('pathUpdate');
});

gulp.task('copy', function () {
    return fileutil.copy(base, build);
});

gulp.task('default', ['build']);