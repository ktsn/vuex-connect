import Vue from 'vue'

import {
  mapState,
  mapGetters,
  mapActions,
  mapMutations
} from 'vuex'

import {
  merge,
  pick,
  omit,
  keys,
  mapValues,
  flattenObject
} from './utils'

const LIFECYCLE_KEYS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'activated',
  'deactivated',
  'beforeDestroy',
  'destroyed'
]

export const createConnect = transform => (options = {}) => {
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

    const originalProps = getOptions(Component).props || {}

    let containerProps, containerPropsKeys
    if (Array.isArray(originalProps)) {
      containerProps = containerPropsKeys = originalProps.filter(p => propKeys.indexOf(p) < 0)
    } else {
      containerProps = omit(originalProps, propKeys)
      containerPropsKeys = Object.keys(containerProps)
    }

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
    insertRenderer(options, name, propKeys.concat(containerPropsKeys), eventKeys)

    if (transform) {
      transform(options, lifecycle)
    }

    return typeof Component === 'function' ? Vue.extend(options) : options
  }
}

function insertRenderer(options, name, propKeys, eventKeys) {
  options.render = function(h) {
    return h(name, {
      props: pick(this, propKeys),
      on: mergeListeners(pick(this, eventKeys), this.$listeners || {}),
      scopedSlots: this.$scopedSlots
    }, flattenObject(this.$slots))
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

function mergeListeners(a, b) {
  Object.keys(b).forEach(key => {
    if (a.hasOwnProperty(key)) {
      a[key] = [].concat(a[key]).concat(b[key])
    } else {
      a[key] = b[key]
    }
  })
  return a
}

function getOptions(Component) {
  if (typeof Component === 'function') {
    return Component.options
  }
  return Component
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
