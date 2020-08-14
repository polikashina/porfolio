const { watch, src, dest, series, parallel } = require("gulp");
const clean = require("gulp-clean");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const pug = require("gulp-pug");
const data = require("gulp-data");
const plumber = require("gulp-plumber");
const embedSvg = require("gulp-embed-svg");
const fs = require("fs");
const browserSync = require("browser-sync").create();

function browserSyncServe(cb) {
  browserSync.init({
    ghostMode: true,
    notify: false,
    server: {
      baseDir: "./public",
    },
    open: true,
  });
  cb();
}

function browserSyncReload(cb) {
  browserSync.reload();
  cb();
}

function css(cb) {
  src(["./src/styles/*.scss", "./src/templates/**/*.scss"])
    .pipe(plumber({ errorHandler: () => console.log("Error in 'css' task") }))
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(concat("style.css"))
    .pipe(dest("./public"))
    .pipe(browserSync.stream());
  cb();
}

function js(cb) {
  src("src/templates/**/*.js")
    .pipe(plumber({ errorHandler: () => console.log("Error in 'js' task") }))
    .pipe(concat("app.js"))
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(uglify())
    .pipe(
      browserSync.reload({
        stream: true,
      })
    )
    .pipe(dest("public"));
  cb();
}

function template(cb) {
  src("src/templates/pages/index/*.pug")
    .pipe(
      plumber({ errorHandler: () => console.log("Error in 'template' task") })
    )
    .pipe(
      data((file) => {
        const templateName = file.path.split("\\").splice(-2, 1);
        try {
          const dataFile = `src/templates/pages/${templateName}/data.json`;
          return fs.existsSync(dataFile)
            ? JSON.parse(fs.readFileSync(dataFile))
            : {};
        } catch (err) {
          return {};
        }
      })
    )
    .pipe(
      pug({
        pretty: true,
      })
    )
    .pipe(
      embedSvg({
        root: "./src/assets/",
      })
    )
    .pipe(dest("public"));
  cb();
}

function assets(cb) {
  src("./src/assets/*").pipe(dest("public/assets"));
  src("./src/assets/fonts/*").pipe(dest("public/assets/fonts"));
  cb();
}

function watchTask(cb) {
  watch("src/templates/**/*.pug", series(template, browserSyncReload));
  watch(
    ["src/styles/*.scss", "src/templates/**/*.scss"],
    series(css, browserSyncReload)
  );
  watch("src/templates/**/*.js", series(js, browserSyncReload));
  watch("src/templates/pages/**/*.json", series(template, browserSyncReload));
  cb();
}

exports.build = parallel(js, css, template, assets);
exports.watch = watchTask;
exports.serve = series(exports.build, watchTask, browserSyncServe);
