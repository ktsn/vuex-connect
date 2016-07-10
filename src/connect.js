import Vue from 'vue';
import { camelToKebab, assign, pick, omit, mapValues } from './utils';

const VERSION = Number(Vue.version.split('.')[0]);

const LIFECYCLE_KEYS = [
  'init',
  'created',
  'beforeCompile',
  'compiled',
  'ready',
  'attached',
  'detached',
  'beforeDestroy',
  'destroyed',

  // 2.0
  'beforeCreate',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'activated',
  'deactivated'
];

export function connect(getters, actions, lifecycle) {
  if (getters == null) getters = {};
  if (actions == null) actions = {};
  if (lifecycle == null) lifecycle = {};

  return function(name, Component) {
    const propKeys = Object.keys(getters).concat(Object.keys(actions));
    const containerProps = omit(getProps(Component), propKeys);

    const options = {
      props: containerProps,
      components: {
        [name]: Component
      },
      vuex: {
        getters,
        actions
      }
    };

    insertRenderer(options, name, propKeys.concat(Object.keys(containerProps)));

    const lifecycle_ = mapValues(pick(lifecycle, LIFECYCLE_KEYS), f => {
      return function() {
        f.call(this, this.$store);
      };
    });

    return Vue.extend(assign(options, lifecycle_));
  };
}

function insertRenderer(options, name, propKeys) {
  if (VERSION >= 2) {
    options.render = function(h) {
      return h(name, { props: pick(this, propKeys) });
    };
  } else {
    const props = propKeys.map(bindProp);
    options.template = `<${name} ${props.join(' ')}></${name}>`;
  }
}

function getProps(Component) {
  if (typeof Component === 'function') {
    return Component.options.props || {};
  }
  return Component.props || {};
}

function bindProp(key) {
  return `:${camelToKebab(key)}="${key}"`;
}
