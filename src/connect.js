import Vue from 'vue';

import {
  mapState,
  mapGetters,
  mapActions,
  mapMutations
} from 'vuex';

import {
  camelToKebab,
  assign,
  pick,
  omit,
  keys,
  mapValues
} from './utils';

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
    stateToProps = {},
    gettersToProps = {},
    actionsToProps = {},
    actionsToEvents = {},
    mutationsToProps = {},
    mutationsToEvents = {},
    methodsToProps = {},
    methodsToEvents = {},
    lifecycle = {}
  } = options;

  return function(name, Component) {
    const propKeys = keys(
      stateToProps,
      gettersToProps,
      actionsToProps,
      mutationsToProps,
      methodsToProps
    );

    const eventKeys = keys(
      actionsToEvents,
      mutationsToEvents,
      methodsToEvents
    );

    const containerProps = omit(getProps(Component), propKeys);

    const options = {
      props: containerProps,
      components: {
        [name]: Component
      },
      computed: assign({},
        mapState(stateToProps),
        mapGetters(gettersToProps)
      ),
      methods: assign({},
        mapActions(assign({}, actionsToProps, actionsToEvents)),
        mapMutations(assign({}, mutationsToProps, mutationsToEvents)),
        mapValues(assign({}, methodsToProps, methodsToEvents), bindStore)
      )
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

function bindStore(fn) {
  return function boundFunctionWithStore(...args) {
    return fn.call(this, this.$store, ...args);
  };
}
