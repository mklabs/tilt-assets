# tilt-assets [![Build Status](https://secure.travis-ci.org/mklabs/tilt-assets.png)](http://travis-ci.org/mklabs/tilt-assets)

> Tiny asset pipeline


## Install

    npm i mklabs/tilt-assets -S

## Usage

```js
var pipeline = asset({
  dirs: 'test/assets/'
});

var server = http.createServer((req, res) => {
  console.log('Incoming request', req.url);

  if (/\.css$/.test(req.url)) return pipeline.handle(req, res);
  if (/\.js/.test(req.url)) return pipeline.handle(req, res);

  res.end('foo');
});

server.listen(3000);
```

### Options

- **dirs** Glob directory patters (must end with a "/". Default: app/assets/)
- **baseURL** Base URL removed from the incoming request URL (Default: '/assets/')

### Browserify

Browserify is the default handler for `.js` files, using Babelify transform.

You can further configure browserify transforms with a [package.json
`browserify.transform`](https://github.com/substack/browserify-handbook#browserifytransform-field)
field.

Other [browserify
options](https://github.com/substack/node-browserify#browserifyfiles--opts) can
be configured using `browserify` field.

For instance, to add a source map to the end of the bundle:

```json
"browserify": {
  "debug": true
}
```

## API
- [Asset](#asset)
  - [HTTP handler](#asset-http-handler)

<a name="asset"></a>
### Asset
new Asset.

```js
var instance = new asset.Asset();
assert.ok(instance.options);
assert.ok(instance instanceof asset.Asset);
assert.equal(instance.dirs, 'app/assets/');
```

Compiles JS into ES6.

```js
var stream = fs.createWriteStream('test/assets/main.output.js');
this.assets.browserify(path.join(__dirname, 'assets/main.js'), stream, (err) => {
  if (err) return done(err);
});
stream.on('finish', () => {
  fs.readFile(stream.path, 'utf8', (err, js) => {
    if (err) return done(err);
    assert.ok(/classCallCheck/.test(js));
    done();
  });
});
```

Compiles CSS using postcss / autoprefixer.

```js
var stream = fs.createWriteStream('test/assets/main.output.css');
this.assets.postcss(path.join(__dirname, 'assets/main.css'), stream, (err) => {
  if (err) return done(err);
});
stream.on('finish', () => {
  fs.readFile(stream.path, 'utf8', (err, css) => {
    if (err) return done(err);
    assert.ok(/display: flex/.test(css));
    assert.ok(/display: -ms-flexbox;/.test(css));
    assert.ok(/display: -webkit-box;/.test(css));
    done();
  });
});
```

<a name="asset-http-handler"></a>
### HTTP handler
Renders foo.

```js
request(this.server)
  .get('/')
  .expect('foo')
  .end(done);
```

Renders js.

```js
request(this.server)
  .get('/main.js')
  // Check basic output
  .expect(/return App/)
  // Check ES6 compilation
  .expect(/classCallCheck/)
  .end(done);
```

Renders css.

```js
request(this.server)
  .get('/main.css')
  // Check basic output
  .expect(/display: flex/)
  // Check autoprefixer output
  .expect(/display: -ms-flexbox/)
  .expect(/display: -webkit-box/)
  .end(done);
```

