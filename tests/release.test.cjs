'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SITE = new URL('https://chinchillacomet.github.io/');
const release = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/release.json'), 'utf8'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const modules = ['pixel', 'typography', 'caption', 'ambient', 'art', 'scene', 'main'];

// Production v4 URLs are intentionally immutable: an older cached index still
// loads these six files together. Change src/ and generate a new release instead.
// These are Git blob SHAs, including the standard blob header, not file SHA-1s.
const legacyV4 = Object.freeze({
  'pixel.js': '773a11566702e93fabb19dfe172689da3d0df1c8',
  'typography.js': 'd9bad1210666646597704027e651227f88ce0e04',
  'ambient.js': '1b266c2961b430eadcec3536ba4050a5f8f1a3ad',
  'art.js': '0e81757b7ce6b42da4d5aedd91adaf4d762cba36',
  'scene.js': '8163f06165e870e6735fc135ef4a26d241563d6a',
  'main.js': 'abf284630898327ff63d0d1d30b29df7bc41b564',
});

function localAsset(reference) {
  const url = new URL(reference, SITE);
  assert.equal(url.origin, SITE.origin, `${reference} must resolve within this site`);
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filename = path.resolve(ROOT, relative);
  assert.ok(filename === ROOT || filename.startsWith(ROOT + path.sep), 'Asset must remain inside the repository');
  return { filename, relative };
}
function attributes(raw) {
  const values = new Map();
  for (const match of raw.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    values.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return values;
}
function tags(name) {
  return Array.from(html.matchAll(new RegExp('<' + name + '\\b([^>]*)>', 'gi')),
    match => attributes(match[1]));
}
function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }

// This checks the generated entry, rather than a template that is not deployed.
test('the production index loads one deferred runtime and its matching released assets', () => {
  const scripts = tags('script');
  assert.equal(scripts.length, 1, 'One bundle prevents independently cached runtime modules');
  assert.ok(scripts[0].has('defer'), 'The bundle must wait for the parsed DOM');
  assert.equal(scripts[0].has('async'), false, 'The runtime must not race document parsing');
  assert.equal(scripts[0].get('src')?.replace(/^\.\//, ''), release.runtime.path);

  const stylesheets = tags('link').filter(tag => tag.get('rel')?.split(/\s+/).includes('stylesheet'));
  assert.equal(stylesheets.length, 1);
  assert.equal(stylesheets[0].get('href')?.replace(/^\.\//, ''), release.stylesheet.path);

  const pictureAssets = new Set();
  for (const tag of [...tags('source'), ...tags('img')]) {
    if (tag.has('src')) pictureAssets.add(localAsset(tag.get('src')).relative);
    for (const candidate of (tag.get('srcset') || '').split(',')) {
      const reference = candidate.trim().split(/\s+/)[0];
      if (reference) pictureAssets.add(localAsset(reference).relative);
    }
  }
  for (const [id, asset] of Object.entries(release.stills)) {
    assert.ok(pictureAssets.has(asset.path), `${id} fallback must belong to the current release`);
  }
  const preview = tags('meta').find(tag => tag.get('property') === 'og:image');
  assert.ok(preview);
  assert.equal(localAsset(preview.get('content')).relative, release.previews.desktop.path);
});

test('runtime, CSS, stills, and previews have matching content hashes and fingerprinted filenames', () => {
  const assets = [release.runtime, release.stylesheet, ...Object.values(release.stills), ...Object.values(release.previews)];
  for (const asset of assets) {
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    const bytes = fs.readFileSync(localAsset(asset.path).filename);
    const digest = sha256(bytes);
    assert.equal(digest, asset.sha256, `${asset.path}: manifest hash must match actual bytes`);
    assert.equal(bytes.length, asset.bytes, `${asset.path}: manifest byte count must match`);
    const filename = path.basename(asset.path);
    const fingerprint = filename.match(/\.([a-f0-9]{12})\.(?:js|css|png)$/);
    assert.ok(fingerprint, `${asset.path}: require a content fingerprint in the URL`);
    assert.equal(fingerprint[1], digest.slice(0, 12), `${asset.path}: filename must match the content hash`);
  }
});

test('the generated runtime and stylesheet exactly match current editable sources', () => {
  const expected = modules.map(name => `/* ${name}.js */\n${fs.readFileSync(path.join(ROOT, 'src', name + '.js'), 'utf8')}`)
    .join('\n;\n');
  const actual = fs.readFileSync(localAsset(release.runtime.path).filename, 'utf8');
  assert.equal(actual, expected, 'Rebuild the release after changing any runtime module');
  assert.doesNotThrow(() => new vm.Script(actual, { filename: release.runtime.path }), 'The actual bundled entry must parse');
  assert.deepEqual(fs.readFileSync(localAsset(release.stylesheet.path).filename),
    fs.readFileSync(path.join(ROOT, 'src/style.css')), 'Rebuild the release after changing its stylesheet');
});

test('every relative resource referenced by the production index exists', () => {
  const references = new Set();
  for (const tag of tags('[a-z][a-z0-9:-]*')) {
    for (const attribute of ['src', 'href', 'poster']) {
      if (tag.has(attribute)) references.add(tag.get(attribute));
    }
    if (tag.has('srcset')) {
      for (const candidate of tag.get('srcset').split(',')) references.add(candidate.trim().split(/\s+/)[0]);
    }
  }
  let checked = 0;
  for (const reference of references) {
    if (!reference || reference.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) continue;
    const asset = localAsset(reference);
    assert.ok(fs.existsSync(asset.filename), `${reference} does not exist`);
    assert.ok(fs.statSync(asset.filename).isFile(), `${reference} must reference a file`);
    checked++;
  }
  assert.ok(checked > 0, 'The generated entry must contain local resources');
});

test('the six legacy v4 JavaScript URLs retain their exact deployed Git blobs', () => {
  for (const [filename, expected] of Object.entries(legacyV4)) {
    const bytes = fs.readFileSync(path.join(ROOT, filename));
    const actual = crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
    assert.equal(actual, expected, `${filename} serves cached v4 HTML; update src/${filename} instead`);
  }
});

const frozenV5 = {
  "assets/releases/welcome.b7befe3a8cb4.js": "b7befe3a8cb40dadf9a1e1e080540a3013795e73aaf75fa5f45b8ce9cf299e73",
  "assets/releases/welcome.732b7d13bac7.css": "732b7d13bac7d3f79089ab4e2d4c2604ab9dfad53b4f37b292e4585f2f196dfb",
  "assets/releases/still-landscape.271a850c1ff3.png": "271a850c1ff3146b478b2f3cd7628c186165412bd41c6b689370a8dad2650847",
  "assets/releases/still-portrait.999cd84d3afe.png": "999cd84d3afef3de3d19d8132dc1d3302742d64b617571412b311ae284723a0f",
  "assets/releases/still-panorama.c849894b6117.png": "c849894b6117d91f2f6857cc0f6e96b28c8a7f6d7d3e8a10bf8239b24cfc40b7",
  "assets/releases/preview-desktop.b26636391d16.png": "b26636391d16bc799d06604bee103f7c44db00e156404c3cd2935cce0e68709a",
  "assets/releases/preview-phone.8370d08862af.png": "8370d08862afa5b1d6952e1787af27ec9342b08eb63eb21551d36c46fb18a2ed"
};

test('previously published v5 resource URLs retain their exact bytes for cached documents', () => {
  for (const [relative, digest] of Object.entries(frozenV5)) {
    const bytes = fs.readFileSync(path.join(ROOT, relative));
    assert.equal(sha256(bytes), digest, `${relative}: never overwrite a published content URL`);
  }
});

const frozenV6 = {
  "assets/releases/welcome.7b55e633827e.js": "7b55e633827ecd85aa02ecff4ad7f2bd4a5ecd5d1fd71634832a22314cb8a6c2",
  "assets/releases/welcome.e93e47473bd4.css": "e93e47473bd4425b4baed7acf0fea6e1197ad95aa549fc7396a0fc1f4f9ff02a",
  "assets/releases/still-landscape.1964e3f01721.png": "1964e3f01721617e16942c21be0ad68a72772eee2be00519090a96a1b2af33fb",
  "assets/releases/still-portrait.d15d6b1b35c4.png": "d15d6b1b35c4d5e0a6bdcf16746b3ea13277fc3d2ed7c69dd5afb8cab9de11d6",
  "assets/releases/still-panorama.af58d4475f86.png": "af58d4475f86a1f9e4f73f646b7d5ac834386c67d66295fa90b1c2834fdfaf0f",
  "assets/releases/preview-desktop.3b8d13740535.png": "3b8d137405352dd9c869b76a6c6ee119cbb3365e680290c9c318d27db5b41740",
  "assets/releases/preview-phone.1b1da1444900.png": "1b1da144490014f8d1359834fabeaf6c561f33ca75d1d0f77e39c79c9c3056d8"
};

test('previously published v6 resource URLs retain their exact bytes for cached documents', () => {
  for (const [relative, digest] of Object.entries(frozenV6)) {
    const bytes = fs.readFileSync(path.join(ROOT, relative));
    assert.equal(sha256(bytes), digest, `${relative}: never overwrite a published content URL`);
  }
});

const frozenV7 = {
  "assets/releases/welcome.7182ac7ae809.js": "7182ac7ae8091d86ca80401edd866c95978494423d0b847a4ec3cf3acd273b8c",
  "assets/releases/welcome.e93e47473bd4.css": "e93e47473bd4425b4baed7acf0fea6e1197ad95aa549fc7396a0fc1f4f9ff02a",
  "assets/releases/still-landscape.43c015dbc31f.png": "43c015dbc31f1658f86aaaf0ee95cf7e57fbd03fd19e7ebf7bc79ccb3098a5b6",
  "assets/releases/still-portrait.50e49539a4cc.png": "50e49539a4ccb13f3b1fc53f045d87e4315490fd3e68462d1f93d461e88f8a90",
  "assets/releases/still-panorama.c08990c84130.png": "c08990c84130f24411c623850bce3a41982a500aca418632dba6826c08cf6793",
  "assets/releases/preview-desktop.19e6721b8ac9.png": "19e6721b8ac9bed7d80fbb38eaa2f1998c9e804d5d1767e763e2450d09285947",
  "assets/releases/preview-phone.6d3e9fd5f044.png": "6d3e9fd5f0443c7152be278cc432753e906d8ef7c842f4d14ba633696f0b33e2"
};

test('previously published v7 resource URLs retain their exact bytes for cached documents', () => {
  for (const [relative, digest] of Object.entries(frozenV7)) {
    const bytes = fs.readFileSync(path.join(ROOT, relative));
    assert.equal(sha256(bytes), digest, `${relative}: never overwrite a published content URL`);
  }
});

const frozenV8 = {
  "assets/releases/welcome.9c974ba77dc3.js": "9c974ba77dc38e6eeadd1637398515707283891294649bc44fdf54942e71bcaf",
  "assets/releases/welcome.defd148d84a1.css": "defd148d84a1d69e0f55a5faddc9000cb5c7ca02a28a583a1bce720c76f73a64",
  "assets/releases/still-landscape.b5d36aa14b69.png": "b5d36aa14b694fed29df18fdb7a83f75b18556460f95ebba57796fac7b82830c",
  "assets/releases/still-portrait.fb4489bd1cd5.png": "fb4489bd1cd5338d65d5bf6c19129d01aff238401ed59b0384b5488549d88353",
  "assets/releases/still-panorama.72bb988b4945.png": "72bb988b4945fd5fb1ba3de1f317a3bc6e56455c80bfaa75577e27ed6909fd9b",
  "assets/releases/preview-desktop.b838d474da70.png": "b838d474da7085dbe909d22904a282f49a24273b1f5b94f6f0962086eef106ea",
  "assets/releases/preview-phone.cc3e167d5b7c.png": "cc3e167d5b7cb54826428a255409c862ada7d95adfd663f9ba988c585c8605d7"
};

test('previously published v8 resource URLs retain their exact bytes for cached documents', () => {
  for (const [relative, digest] of Object.entries(frozenV8)) {
    const bytes = fs.readFileSync(path.join(ROOT, relative));
    assert.equal(sha256(bytes), digest, `${relative}: never overwrite a published content URL`);
  }
});

const frozenV9 = {
  "assets/releases/welcome.75751f1299b8.js": "75751f1299b8085165863fbbd38c8027435a687330a408d41b16fac7001f298a",
  "assets/releases/welcome.702adb74aeb5.css": "702adb74aeb56b1b00589ed90be15c276d1a5e818dcdbc45cf02690cb725caa6",
  "assets/releases/still-landscape.4425e7397d3c.png": "4425e7397d3c89edcc4634c49eddbd795d0b4b579540099ff5744d86de233f62",
  "assets/releases/still-portrait.96674352aa85.png": "96674352aa856f7044f6e648831ba2056da9c8c2641105f0609200df6d641bbb",
  "assets/releases/still-panorama.ca5147222e31.png": "ca5147222e318252d8f935b47ef9b8d760d68b362a76192836ccfe4f36a03f63",
  "assets/releases/preview-desktop.4315b811ddc3.png": "4315b811ddc3c5236542701b9cb26a80f744d23978be6fe105a2bc7a45ffe849",
  "assets/releases/preview-phone.72ca80e7b937.png": "72ca80e7b937ca3a9f5f3db3956c60e69c62772cac9b19a99119778a40781731"
};

test('previously published v9 resource URLs retain their exact bytes for cached documents', () => {
  for (const [relative, digest] of Object.entries(frozenV9)) {
    const bytes = fs.readFileSync(path.join(ROOT, relative));
    assert.equal(sha256(bytes), digest, `${relative}: never overwrite a published content URL`);
  }
});

const frozenV10 = {
  "assets/releases/welcome.5a24358efc12.js": "5a24358efc12bebecf585f830239b6b5926506ce8c100cf9a874f5044ce60bc7",
  "assets/releases/welcome.702adb74aeb5.css": "702adb74aeb56b1b00589ed90be15c276d1a5e818dcdbc45cf02690cb725caa6",
  "assets/releases/still-landscape.54f31fbacf12.png": "54f31fbacf122bd4fe818d1c21ffb74f61cbf2383463056624c718e5c5c6a0ae",
  "assets/releases/still-portrait.04bf256b0925.png": "04bf256b0925fd7bd2908b7f972671dd034b8379c769e8e82e24f4babc91714b",
  "assets/releases/still-panorama.e07b3acba847.png": "e07b3acba8476a177689c71c2b0dbfc604595dc9e8c1e22eb4819fa90ee1f2d0",
  "assets/releases/preview-desktop.4a23c93a1d89.png": "4a23c93a1d89328687cde03a5c2341313ee3d97e57bd3a62fb1d7a1dc6048f77",
  "assets/releases/preview-phone.a98aba2f83c6.png": "a98aba2f83c656aaac5ae5b71ae04e71cb8697d11c5482cffabbed5546d25707"
};

test('previously published v10 resource URLs retain their exact bytes for cached documents', () => {
  for (const [relative, digest] of Object.entries(frozenV10)) {
    const bytes = fs.readFileSync(path.join(ROOT, relative));
    assert.equal(sha256(bytes), digest, `${relative}: never overwrite a published content URL`);
  }
});

const frozenV11 = {
  "assets/releases/welcome.b586fc7c3205.js": "b586fc7c32055a87e207bae4cea5edc8758b955a064c5555e73f0a77ac57152c",
  "assets/releases/welcome.702adb74aeb5.css": "702adb74aeb56b1b00589ed90be15c276d1a5e818dcdbc45cf02690cb725caa6",
  "assets/releases/still-landscape.c4e0a0f10d9c.png": "c4e0a0f10d9cffe4247674c9549d51ded51f4efd7e26a6b5050ecf0de11ce6f6",
  "assets/releases/still-portrait.dbaa64cde540.png": "dbaa64cde540249cb3b07b5646e8d10af7efd382c8c9220c181d8a82931fe71f",
  "assets/releases/still-panorama.813353757d8d.png": "813353757d8daeda133817471975bbd1cf2e3e5fe599e71158f4780228aee043",
  "assets/releases/preview-desktop.a396ffa2b11b.png": "a396ffa2b11bf184213bc1746d660b6187b43085f4cb97521eb2742b67799bb1",
  "assets/releases/preview-phone.a9e8c494dd07.png": "a9e8c494dd079c2cc314fcb433b852fc12c4f6da8bd31bbab5bc60b33e72f82d"
};

test('previously published v11 resource URLs retain their exact bytes for cached documents', () => {
  for (const [relative, digest] of Object.entries(frozenV11)) {
    const bytes = fs.readFileSync(path.join(ROOT, relative));
    assert.equal(sha256(bytes), digest, `${relative}: never overwrite a published content URL`);
  }
});
