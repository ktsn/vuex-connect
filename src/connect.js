import Vue from 'vue';
import { camelToKebab } from './utils';

export function connect(getters, actions) {
  if (getters == null) getters = {};
  if (actions == null) actions = {};

  return function(name, Component) {
    const getterProps = Object.keys(getters).map(bindProp);
    const actionProps = Object.keys(actions).map(bindProp);

    return Vue.extend({
      template: `<${name} ${getterProps.concat(actionProps).join(' ')}></${name}>`,
      components: {
        [name]: Component
      },
      vuex: {
        getters,
        actions
      }
    });
  };
}

function bindProp(key) {
  return `:${camelToKebab(key)}="${key}"`;
}
