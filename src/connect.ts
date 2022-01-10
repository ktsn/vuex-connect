import Vue, { ComponentOptions, Component, CreateElement, VNode } from 'vue'

import {
  mapState,
  mapGetters,
  mapActions,
  mapMutations,
  Dispatch,
  Commit,
  Store
} from 'vuex'

import { merge, pick, omit, keys, mapValues, flattenObject } from './utils'

export type TransformFunction = (
  options: ComponentOptions<any>,
  lifecycle: Record<string, Function>
) => void

export type StateMapper<S, G> =
  | string
  | ((this: Vue, state: S, getters: G) => any)

export type ActionMapper =
  | string
  | ((this: Vue, dispatch: Dispatch, ...args: any[]) => any)

export type MutationMapper =
  | string
  | ((this: Vue, commit: Commit, ...args: any[]) => any)

export interface ConnectOptions<S, G> {
  stateToProps?: Record<string, StateMapper<S, G>> | string[]
  gettersToProps?: Record<string, string> | string[]
  actionsToProps?: Record<string, ActionMapper> | string[]
  actionsToEvents?: Record<string, ActionMapper> | string[]
  mutationsToProps?: Record<string, MutationMapper> | string[]
  mutationsToEvents?: Record<string, MutationMapper> | string[]
  lifecycle?: Record<string, Function>
}

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

export function createConnect<StateType = any, GettersType = any>(
  transform?: TransformFunction
) {
  return function connect<S = StateType, G = GettersType>(
    options: ConnectOptions<S, G> = {}
  ) {
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
    } = mapValues(options as any, normalizeOptions)

    function connectToComponent<C extends Component>(
      name: string | C,
      Component: C
    ): C
    function connectToComponent<C extends Component>(name: C): C
    function connectToComponent(
      nameOrComponent: string | Component,
      optionalComponent?: Component
    ): Component {
      let Component: Component, name: string
      if (typeof nameOrComponent !== 'string') {
        Component = nameOrComponent
        name = getOptions(Component).name || 'wrapped-anonymous-component'
      } else {
        Component = optionalComponent!
        name = nameOrComponent
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

      const containerProps = omit(collectProps(Component), propKeys)
      const containerPropsKeys = Object.keys(containerProps)

      const options = {
        name: `connect-${name}`,
        props: containerProps,
        components: {
          [name]: Component
        },
        computed: merge(mapState(stateToProps), mapGetters(gettersToProps)),
        methods: merge(
          mapActions(merge(actionsToProps, actionsToEvents)),
          mapMutations(merge(mutationsToProps, mutationsToEvents)),
          mapValues(merge(methodsToProps, methodsToEvents), bindStore)
        )
      }

      insertLifecycleMixin(options, lifecycle)
      insertRenderer(
        options,
        name,
        propKeys.concat(containerPropsKeys),
        eventKeys
      )

      if (transform) {
        transform(options, lifecycle)
      }

      return typeof Component === 'function' ? Vue.extend(options) : options
    }

    return connectToComponent
  }
}

function insertRenderer(
  options: ComponentOptions<any>,
  name: string,
  propKeys: string[],
  eventKeys: string[]
): void {
  options.render = function(this: Vue, h: CreateElement) {
    return h(
      name,
      {
        props: pick(this, propKeys),
        attrs: {...this.$attrs},
        on: mergeListeners(pick(this, eventKeys), this.$listeners || {}),
        scopedSlots: this.$scopedSlots
      },
      flattenObject(this.$slots).map(slot => patchSlot(slot, this))
    )
  }
}

function insertLifecycleMixin(
  options: ComponentOptions<any>,
  lifecycle: Record<string, (this: Vue, store: Store<any>) => any>
): void {
  options.mixins = [
    mapValues(pick(lifecycle, LIFECYCLE_KEYS), f => {
      return function boundLifecycle(this: Vue) {
        f.call(this, this.$store)
      }
    })
  ]
}

function mergeListeners(
  a: Record<string, Function | Function[]>,
  b: Record<string, Function | Function[]>
): Record<string, Function | Function[]> {
  Object.keys(b).forEach(key => {
    if (a.hasOwnProperty(key)) {
      a[key] = ([] as Function[]).concat(a[key]).concat(b[key])
    } else {
      a[key] = b[key]
    }
  })
  return a
}

function getOptions(Component: Component): ComponentOptions<any> {
  if (typeof Component === 'function') {
    return (Component as any).options
  }
  return Component as ComponentOptions<any>
}

/**
 * Collect all props options of the component.
 * It traverses all mixins and ancester components.
 */
function collectProps(Component: Component): Record<string, any> {
  const options = getOptions(Component)

  const supers = options.mixins || []
  if (options.extends) {
    supers.push(options.extends)
  }

  const superProps = supers.reduce((acc, s) => {
    return merge(acc, collectProps(s))
  }, {})

  let props: string[] | Record<string, any> = options.props || {}
  if (Array.isArray(props)) {
    props = props.reduce<Record<string, any>>((acc, key) => {
      acc[key] = null
      return acc
    }, {})
  }

  return merge(superProps, props)
}

function bindStore(
  fn: (this: Vue, store: Store<any>, ...args: any[]) => any
): (...args: any[]) => any {
  return function boundFunctionWithStore(this: Vue, ...args) {
    return fn.call(this, this.$store, ...args)
  }
}

function normalizeOptions(options: Record<string, any>): Record<string, any> {
  return Array.isArray(options)
    ? options.reduce((obj, value) => {
        obj[value] = value
        return obj
      }, {})
    : options
}

/**
 * Modify the slot context to let Vue handle
 * named slot expectedly
 */
function patchSlot(vnode: VNode, vm: Vue): VNode
function patchSlot(vnode: any, vm: any): VNode {
  if (vnode.context) {
    vnode.context = vm._self
  }
  if (vnode.fnContext) {
    vnode.fnContext = vm._self
  }
  return vnode
}
