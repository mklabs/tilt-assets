
var fs      = require('fs');
var path    = require('path');
var asset   = require('..');
var assert  = require('assert');
var http    = require('http');
var debug   = require('debug')('tilt-asset:test');
var request = require('supertest');

describe('Asset', () => {

  before(() => {
    var app = this.assets = asset({
      dirs: 'test/assets/'
    });

    this.server = http.createServer((req, res) => {
      debug('Incoming request', req.url);

      if (/\.css$/.test(req.url)) return app.handle(req, res);
      if (/\.js/.test(req.url)) return app.handle(req, res);

      res.end('foo');
    });
  });

  it('new Asset', () => {
    var instance = new asset.Asset();
    assert.ok(instance.options);
    assert.ok(instance instanceof asset.Asset);
    assert.equal(instance.dirs, 'app/assets/');
  });

  it('Compiles JS into ES6', (done) => {
    var stream = fs.createWriteStream('test/assets/main.output.js');

    this.assets.browserify(path.join(__dirname, 'assets/main.js'), stream, (err) => {
      if (err) return done(err);
    });

    stream.on('finish', () => {
      fs.readFile(stream.path, 'utf8', (err, js) => {
        if (err) return done(err);
        assert.ok(/classCallCheck/.test(js));
        // fs.unlink(stream.path, done);
        done();
      });
    });

  });

  it('Compiles CSS using postcss / autoprefixer', () => {
    var stream = fs.createWriteStream('test/assets/main.output.css');

    this.assets.browserify(path.join(__dirname, 'assets/main.css'), stream, (err) => {
      if (err) return done(err);
    });

    stream.on('finish', () => {
      fs.readFile(stream.path, 'utf8', (err, css) => {
        if (err) return done(err);
        assert.ok(/display: flex/.test(css));
        assert.ok(/display: -ms-flexbox;/.test(css));
        assert.ok(/display: -webkit-box;/.test(css));
        // fs.unlink(stream.path, done);
        done();
      });
    });
  });

  describe('HTTP handler', () => {
    it('Renders foo', (done) => {
      request(this.server)
        .get('/')
        .expect('foo')
        .end(done);
    });

    it('Renders js', (done) => {
      request(this.server)
        .get('/main.js')
        // Check basic output
        .expect(/return App/)
        // Check ES6 compilation
        .expect(/classCallCheck/)
        .end(done);
    });

    it('Renders css', (done) => {
      request(this.server)
        .get('/main.css')
        // Check basic output
        .expect(/display: flex/)
        // Check autoprefixer output
        .expect(/display: -ms-flexbox/)
        .expect(/display: -webkit-box/)
        .end(done);
    });

  });

});
