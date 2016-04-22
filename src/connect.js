import Vue from 'vue';
import { camelToKebab } from './utils';

export function connect(getters, actions) {
  if (getters == null) getters = {};
  if (actions == null) actions = {};

  return function(name, Component) {
    const container = Vue.extend({
      name: `${name}-container`,
      components: {
        [name]: Component
      }
    });

    const _init = container.prototype._init;
    container.prototype._init = function(options = {}) {
      const getterProps = Object.keys(getters).map(bindProp);
      const actionProps = Object.keys(actions).map(bindProp);

      options.template = `<${name} ${getterProps.concat(actionProps).join(' ')}></${name}>`;

      options.vuex = options.vuex || {};
      options.vuex.getters = getters;
      options.vuex.actions = actions;

      _init.call(this, options);
    };

    return container;
  };
}

function bindProp(key) {
  return `:${camelToKebab(key)}="${key}"`;
}
