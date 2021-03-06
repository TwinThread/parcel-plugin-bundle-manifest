const path = require('path');
const fs = require('fs');

module.exports = function (bundler) {

  /**
   * Read the paths already registered within the manifest.json
   * @param {string} path 
   * @returns {Object}
   */
  const readManifestJson = (path) => {
    if (!fs.existsSync(path)) {
      console.info('✨ create manifest file');
      return {};
    };

    console.info('🖊 update manifest file');

    try {
      return JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch(e) {
      console.error('manifest file is invalid');
      throw e; 
    }
  };

  /**
   * Feed the manifest exploring childBundles recursively
   * @param {Bundle} bundle 
   * @param {Object} manifestValue 
   * @param {string} publicURL 
   */
  const feedManifestValue = (bundle, manifestValue, publicURL) => {
    let output = path.join(publicURL, (path || {}).basename(bundle.name));
    const input = 
      bundle.entryAsset ? (bundle.entryAsset || {}).basename : 
      bundle.assets.size ? (bundle.assets.values().next().value || {}).basename : 
      null;
    if(input && !manifestValue[input]) {
      manifestValue[input] = output;
      console.info(`✓ bundle : ${input} => ${output}`);
    }
    bundle.childBundles.forEach(function (bundle) {
      feedManifestValue(bundle, manifestValue, publicURL);
    });
  }

  bundler.on('bundled', (bundle) => {
    const dir = bundle.entryAsset.options.outDir;
    const publicURL = bundle.entryAsset.options.publicURL;

    const manifestPath = path.resolve(dir, 'parcel-manifest.json');
    const manifestValue = {}

    console.info('📦 PackageManifestPlugin');
    feedManifestValue(bundle, manifestValue, publicURL);
    console.info(`📄 manifest : ${manifestPath}`);

    const oldManifestValue = readManifestJson(manifestPath);
    const combinedManifest = Object.assign(oldManifestValue, manifestValue)
    fs.writeFileSync(manifestPath, JSON.stringify(combinedManifest, null, 2));
  });
};
