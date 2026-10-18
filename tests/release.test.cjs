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
const modules = ['pixel', 'typography', 'ambient', 'art', 'scene', 'main'];

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
