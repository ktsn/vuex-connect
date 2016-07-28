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

export function connect(options = {}) {
  const {
    gettersToProps = {},
    actionsToProps = {},
    actionsToEvents = {},
    lifecycle = {}
  } = options;

  return function(name, Component) {
    const propKeys = Object.keys(gettersToProps).concat(Object.keys(actionsToProps));
    const eventKeys = Object.keys(actionsToEvents);

    const containerProps = omit(getProps(Component), propKeys);

    const options = {
      props: containerProps,
      components: {
        [name]: Component
      },
      vuex: {
        getters: gettersToProps,
        actions: assign({}, actionsToProps, actionsToEvents)
      }
    };

    insertLifecycleMixin(options, lifecycle);
    insertRenderer(options, name, propKeys.concat(Object.keys(containerProps)), eventKeys);

    return Vue.extend(options);
  };
}

function insertRenderer(options, name, propKeys, eventKeys) {
  if (VERSION >= 2) {
    options.render = function(h) {
      return h(name, {
        props: pick(this, propKeys),
        on: pick(this, eventKeys)
      });
    };
  } else {
    const props = propKeys.map(bindProp);
    options.template = `<${name} v-ref:component ${props.join(' ')}></${name}>`;

    // register event listeners on the compiled hook
    // because vue cannot recognize camelCase name on the template
    options.compiled = function() {
      eventKeys.forEach(key => {
        this.$refs.component.$on(key, this[key]);
      });
    };
  }
}

function insertLifecycleMixin(options, lifecycle) {
  options.mixins = [
    mapValues(pick(lifecycle, LIFECYCLE_KEYS), f => {
      return function boundLifecycle() {
        f.call(this, this.$store);
      };
    })
  ];
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
