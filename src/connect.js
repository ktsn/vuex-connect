import Vue from 'vue';
import { camelToKebab, assign, pick, mapValues } from './utils';

const LIFECYCLE_KEYS = [
  'init',
  'created',
  'beforeCompile',
  'compiled',
  'ready',
  'attached',
  'detached',
  'beforeDestroy',
  'destroyed'
];

export function connect(getters, actions, lifecycle) {
  if (getters == null) getters = {};
  if (actions == null) actions = {};
  if (lifecycle == null) lifecycle = {};

  return function(name, Component) {
    const getterProps = Object.keys(getters).map(bindProp);
    const actionProps = Object.keys(actions).map(bindProp);

    const options = {
      template: `<${name} ${getterProps.concat(actionProps).join(' ')}></${name}>`,
      components: {
        [name]: Component
      },
      vuex: {
        getters,
        actions
      }
    };

    const lifecycle_ = mapValues(pick(lifecycle, LIFECYCLE_KEYS), f => {
      return function() {
        f.call(this, this.$store);
      };
    });

    return Vue.extend(assign(options, lifecycle_));
  };
}

function bindProp(key) {
  return `:${camelToKebab(key)}="${key}"`;
}
