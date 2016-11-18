import Vue from 'vue'

import {
  mapState,
  mapGetters,
  mapActions,
  mapMutations
} from 'vuex'

import {
  camelToKebab,
  merge,
  pick,
  omit,
  keys,
  mapValues
} from './utils'

const VERSION = Number(Vue.version.split('.')[0])

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
]

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
  } = mapValues(options, normalizeOptions)

  return function(name, Component) {
    if (typeof name !== 'string') {
      Component = name
      name = getOptions(Component).name || 'wrapped-anonymous-component'
    }

    const propKeys = keys(
      stateToProps,
      gettersToProps,
      actionsToProps,
      mutationsToProps,
      methodsToProps
    )

    const eventKeys = keys(
      actionsToEvents,
      mutationsToEvents,
      methodsToEvents
    )

    const containerProps = omit(getOptions(Component).props || {}, propKeys)

    const options = {
      name: `connect-${name}`,
      props: containerProps,
      components: {
        [name]: Component
      },
      computed: merge(
        mapState(stateToProps),
        mapGetters(gettersToProps)
      ),
      methods: merge(
        mapActions(merge(actionsToProps, actionsToEvents)),
        mapMutations(merge(mutationsToProps, mutationsToEvents)),
        mapValues(merge(methodsToProps, methodsToEvents), bindStore)
      )
    }

    insertLifecycleMixin(options, lifecycle)
    insertRenderer(options, name, propKeys.concat(Object.keys(containerProps)), eventKeys)

    return Vue.extend(options)
  }
}

function insertRenderer(options, name, propKeys, eventKeys) {
  if (VERSION >= 2) {
    options.render = function(h) {
      return h(name, {
        props: pick(this, propKeys),
        on: pick(this, eventKeys)
      })
    }
  } else {
    const props = propKeys.map(bindProp)
    options.template = `<${name} v-ref:component ${props.join(' ')}></${name}>`

    // register event listeners on the compiled hook
    // because vue cannot recognize camelCase name on the template
    options.compiled = function() {
      eventKeys.forEach(key => {
        this.$refs.component.$on(key, this[key])
      })
    }
  }
}

function insertLifecycleMixin(options, lifecycle) {
  options.mixins = [
    mapValues(pick(lifecycle, LIFECYCLE_KEYS), f => {
      return function boundLifecycle() {
        f.call(this, this.$store)
      }
    })
  ]
}

function getOptions(Component) {
  if (typeof Component === 'function') {
    return Component.options
  }
  return Component
}

function bindProp(key) {
  return `:${camelToKebab(key)}="${key}"`
}

function bindStore(fn) {
  return function boundFunctionWithStore(...args) {
    return fn.call(this, this.$store, ...args)
  }
}

function normalizeOptions(options) {
  return Array.isArray(options)
    ? options.reduce((obj, value) => {
      obj[value] = value
      return obj
    }, {})
    : options
}
