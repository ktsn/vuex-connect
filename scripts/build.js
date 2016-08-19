const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const replace = require('rollup-plugin-replace');
const uglify = require('rollup-plugin-uglify');
const meta = require('../package.json');

const banner = `/*!
 * ${meta.name} v${meta.version}
 * ${meta.homepage}
 *
 * Copyright (c) 2016 ${meta.author}
 * Released under the MIT license
 * ${meta.homepage}/blob/master/LICENSE
 */`;

const moduleName = 'VuexConnect';

const globals = {
  vue: 'Vue',
  vuex: 'Vuex'
};

const config = {
  entry: 'src/index.js',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ],
  external: ['vue', 'vuex']
};

rollup(config)
  .then(bundle => {
    return bundle.write({
      format: 'cjs',
      dest: `dist/${meta.name}.common.js`,
      banner,
      globals
    });
  })
  .then(() => rollup(addPlugins(config, [
    replace({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ])))
  .then(bundle => bundle.write({
    format: 'umd',
    dest: `dist/${meta.name}.js`,
    banner,
    moduleName,
    globals
  }))
  .then(() => rollup(addPlugins(config, [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    uglify({
      output: {
        comments: function(node, comment) {
          const text = comment.value;
          const type = comment.type;
          if (type === 'comment2') {
            return /^!/i.test(text);
          }
        }
      }
    })
  ])))
  .then(bundle => bundle.write({
    format: 'umd',
    dest: `dist/${meta.name}.min.js`,
    banner,
    moduleName,
    globals
  }))
  .catch(error => {
    console.error(error);
  });

function addPlugins(config, plugins) {
  return Object.assign({}, config, {
    plugins: config.plugins.concat(plugins)
  });
}
