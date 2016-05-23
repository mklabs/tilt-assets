const fs           = require('fs');
const path         = require('path');
const glob         = require('glob');
const debug        = require('debug')('tilt-asset');
const browserify   = require('browserify');
const watchify     = require('watchify');
const postcss      = require('postcss');
const precss       = require('postcss');
const scss         = require('postcss-scss');
const autoprefixer = require('autoprefixer');
const finalhandler = require('finalhandler');


// Public: Asset pipeline
//
// This class implements a basic asset pipeline based on file extension.
//
// - `.js`  -> Goes through browerify with babelify transform
// - `.css` -> Goes through postcss with autoprefixer plugin
class Asset {

  // Public: Filetype to method handlers mapping
  get handlers() {
    return {
      '.js':  'browserify',
      '.css': 'postcss'
    };
  }

  constructor(options = {}) {
    this.options = options;
    this.options.baseURL = this.options.baseURL || '/assets/';
    this.dirs = this.options.dirs || 'app/assets/';

    if (this.dirs.charAt(this.dirs.length - 1) !== '/') throw new Error('"dirs" options must end with a "/"');

    this.regex = new RegExp('^' + this.options.baseURL);
    debug('Asset handler created', this.options);
    debug('Will strip out ^%s from incoming request URLs and look in %s directories', this.options.baseURL, this.dirs);
  }

  // Public: Main request handler
  handle(req, res, next) {
    next = next || finalhandler(req, res);

    var filename = path.join(this.dirs, req.url.replace(this.regex, ''));

    debug('Asset %s (Lookup %s)', req.url, filename);
    return glob(filename, (err, files) => {
      if (err) return next(err);
      if (!files.length) return next(new Error('Asset ' + filename + ' not found'));

      var file = files[0];

      debug('Asset found:', file);
      return this.compile(file, res, next);
    });
  }

  compile(file, stream, next) {
    var ext = path.extname(file);

    var handler = this.handlers[ext];
    if (!handler) return next('Filetype ' + ext + ' not supported');

    debug('Compile using %s handler', this.handlers[ext]);
    var method = this[handler];
    method.apply(this, arguments);
  }

  browserify(file, stream, next) {
    debug('Browserify %s file', file);
    var b = browserify({
      entries: [ file ]
    });

    b.transform('babelify', {
      presets: ['es2015']
    });

    var bundle = b.bundle();
    bundle.on('error', (e) => {
      debug('Browserify error', e);
    });

    bundle.pipe(stream);
  }

  postcss(file, stream, next) {
    debug('Read file', file);

    fs.readFile(file, 'utf8', (err, css) => {
      if (err) return next(err);

      return postcss([ autoprefixer ])
        .process(css)
        .catch((err) => {
          debug('Error', err);
          return next(err);
        })
        .then((result) => {
          debug('CSS:', result.css);
          stream.end(result.css);
        });
    });
  }
}

module.exports = Asset;
