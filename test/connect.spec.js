import assert from 'power-assert'
import * as td from 'testdouble'
import { setup, teardown } from './stub/dom'

import { connect } from '../src'

import Vue from 'vue'
import Vuex from 'vuex'

describe('connect', () => {
  const TEST = 'TEST'
  let state, getters, actions, mutations, store, options, Component

  beforeEach(() => {
    setup()

    state = {
      foo: 'foo'
    }

    getters = {
      foo: state => state.foo
    }

    actions = {
      [TEST]({ commit }, value) {
        commit('TEST', value + value)
      }
    }

    mutations = {
      [TEST](state, value) {
        state.foo = value
      }
    }

    store = new Vuex.Store({ state, getters, actions, mutations })

    options = {
      props: ['a', 'b', 'foo', TEST],
      render(h) {
        return h('div', [
          h('div', { class: 'named-slot' }, [this.$slots.namedSlot]),
          h('div', { class: 'default-slot' }, [this.$slots.default]),
          h('div', { class: 'named-scoped-slot' }, [
            this.$scopedSlots.namedScopedSlot &&
              this.$scopedSlots.namedScopedSlot({
                text: 'named'
              })
          ]),
          h('div', { class: 'default-scoped-slot' }, [
            this.$scopedSlots.default &&
              this.$scopedSlots.default({
                text: 'default'
              })
          ])
        ])
      }
    }

    Component = Vue.extend(options)
  })

  afterEach(teardown)

  it('returns wrapped Vue component', () => {
    const actual = connect()('example', Component)
    assert(typeof actual === 'function')
  })

  it('returns wrapped component options', () => {
    const actual = connect()('example', options)
    assert(typeof actual === 'object')
  })

  it('sets a name on the wrapper component', () => {
    const actual = connect()('example', Component)
    assert(actual.options.name === 'connect-example')
  })

  it('sets name to given component', () => {
    const Container = connect()('test', Component)
    const { wrapped } = mountContainer(store, Container)

    assert(wrapped.$options._componentTag === 'test')
  })

  it('sets registered name in options of component', () => {
    const Component = { name: 'test', render: h => h() }
    const Container = connect()(Component)
    const { wrapped } = mountContainer(store, Container)

    assert(wrapped.$options._componentTag === 'test')
  })

  it('register as anonymus component if name option is not specified', () => {
    const Container = connect()(Component)
    const { wrapped } = mountContainer(store, Container)

    assert(wrapped.$options._componentTag === 'wrapped-anonymous-component')
  })

  it('binds state mapping to component props', done => {
    const Container = connect({
      stateToProps: {
        a: state => state.foo
      }
    })('example', Component)

    const { wrapped } = mountContainer(store, Container)

    assert(wrapped.a === 'foo')

    store.state.foo = 'bar'

    wrapped.$nextTick(() => {
      // ensure the props can detect changes
      assert(wrapped.a === 'bar')
      done()
    })
  })

  it('binds getters to component props', done => {
    const Container = connect({
      gettersToProps: {
        a: 'foo'
      }
    })('example', Component)

    const { wrapped } = mountContainer(store, Container)

    assert(wrapped.a === 'foo')

    store.state.foo = 'bar'

    wrapped.$nextTick(() => {
      // ensure the props can detect changes
      assert(wrapped.a === 'bar')
      done()
    })
  })

  it('binds actions to component props', () => {
    const Container = connect({
      actionsToProps: {
        a: TEST
      }
    })('example', Component)

    const { wrapped } = mountContainer(store, Container)

    assert(store.state.foo === 'foo')
    wrapped.a('bar')
    assert(store.state.foo === 'barbar')
  })

  it('binds actions to component events', () => {
    const Container = connect({
      actionsToEvents: {
        camelEvent: TEST,
        'kebab-event': TEST
      }
    })('example', Component)

    const { wrapped } = mountContainer(store, Container)

    assert(store.state.foo === 'foo')
    wrapped.$emit('camelEvent', 'bar')
    assert(store.state.foo === 'barbar')

    wrapped.$emit('kebab-event', 'baz')
    assert(store.state.foo === 'bazbaz')
  })

  it('binds mutations to component props', () => {
    const Container = connect({
      mutationsToProps: {
        a: TEST
      }
    })('example', Component)

    const { wrapped } = mountContainer(store, Container)

    assert(store.state.foo === 'foo')
    wrapped.a('bar')
    assert(store.state.foo === 'bar')
  })

  it('binds mutations to component events', () => {
    const Container = connect({
      mutationsToEvents: {
        camelEvent: TEST,
        'kebab-event': TEST
      }
    })('example', Component)

    const { wrapped } = mountContainer(store, Container)

    assert(store.state.foo === 'foo')
    wrapped.$emit('camelEvent', 'bar')
    assert(store.state.foo === 'bar')

    wrapped.$emit('kebab-event', 'baz')
    assert(store.state.foo === 'baz')
  })

  it('binds inline functions to component props', () => {
    const Container = connect({
      methodsToProps: {
        a: (_store, value) => {
          assert(_store === store)
          _store.commit(TEST, value)
        }
      }
    })('example', Component)

    const { wrapped } = mountContainer(store, Container)

    assert(store.state.foo === 'foo')
    wrapped.a('bar')
    assert(store.state.foo === 'bar')
  })

  it('binds inline functions to component events', () => {
    const fn = (_store, value) => {
      assert(_store === store)
      _store.commit(TEST, value)
    }

    const Container = connect({
      methodsToEvents: {
        camelEvent: fn,
        'kebab-event': fn
      }
    })('example', Component)

    const { wrapped } = mountContainer(store, Container)

    assert(store.state.foo === 'foo')
    wrapped.$emit('camelEvent', 'bar')
    assert(store.state.foo === 'bar')

    wrapped.$emit('kebab-event', 'baz')
    assert(store.state.foo === 'baz')
  })

  it('allows array style binding', done => {
    const Container = connect({
      gettersToProps: ['foo'],
      mutationsToProps: [TEST]
    })('example', Component)

    const { wrapped } = mountContainer(store, Container)

    assert(wrapped.foo === 'foo')
    wrapped[TEST]('bar')

    Vue.nextTick(() => {
      assert(wrapped.foo === 'bar')
      done()
    })
  })

  it('injects lifecycle hooks', done => {
    const counts = {}
    const lifecycle = {}

    function _assert(name) {
      return function(_store) {
        assert(_store === store)
        assert(this instanceof C)
        counts[name] += 1
      }
    }

    ;[
      'beforeCreate',
      'created',
      'beforeDestroy',
      'destroyed',
      'beforeMount',
      'mounted',
      'beforeUpdate',
      'updated',
      'activated',
      'deactivated'
    ].forEach(key => {
      counts[key] = 0
      lifecycle[key] = _assert(key)
    })

    const C = connect({
      lifecycle
    })('example', Component)

    const { root, container } = mountContainer(store, C)
    container.$forceUpdate()

    Vue.nextTick(() => {
      root.show = false

      Vue.nextTick(() => {
        container.$destroy()
        assert.deepStrictEqual(counts, {
          beforeCreate: 1,
          created: 1,
          beforeDestroy: 1,
          destroyed: 1,
          beforeMount: 1,
          mounted: 1,
          beforeUpdate: 1,
          updated: 1,
          activated: 1,
          deactivated: 1
        })
        done()
      })
    })
  })

  it('passes container props to component props if no getters and actions are specified', () => {
    const C = connect({
      gettersToProps: {
        a: 'foo'
      }
    })('example', Component)

    const { container } = mountContainer(store, C, {
      props: {
        a: 1,
        b: 'test'
      }
    })

    assert(container.a === 'foo') // should not override container props
    assert(container.b === 'test')
  })

  it('accepts component options for wrapped component', () => {
    const C = connect({
      gettersToProps: {
        a: 'foo'
      },
      actionsToProps: {
        b: TEST
      }
    })('example', options)

    const { container } = mountContainer(store, C)

    assert(container.a === 'foo')
    container.b('bar')
    assert(container.a === 'barbar')
  })

  it('receives injected slots', () => {
    const C = connect()('example', options)

    const { wrapped } = mountContainer(store, C, {
      slots: h => {
        return [
          h('div', ['default-slot']),
          h('div', { slot: 'namedSlot' }, ['named-slot'])
        ]
      },
      scopedSlots: {
        default: (h, props) => h('div', [props.text + '-scoped-slot']),
        namedScopedSlot: (h, props) => h('div', [props.text + '-scoped-slot'])
      }
    })

    function query(selector) {
      return wrapped.$el.querySelector(selector)
    }
    assert(query('.default-slot').textContent === 'default-slot')
    assert(query('.named-slot').textContent === 'named-slot')
    assert(query('.default-scoped-slot').textContent === 'default-scoped-slot')
    assert(query('.named-scoped-slot').textContent === 'named-scoped-slot')
  })

  it('ports wrapped component events', () => {
    const foo = td.function()
    const bar = td.function()

    const C = connect({
      mutationsToEvents: {
        bar: TEST
      }
    })('example', options)

    const { wrapped } = mountContainer(store, C, {
      on: {
        foo,
        bar
      }
    })

    wrapped.$emit('foo', 'foo')
    wrapped.$emit('bar', 'bar')

    td.verify(foo('foo'))
    td.verify(bar('bar'))
    assert(store.state.foo === 'bar')
  })

  it('should handle array style props definition', () => {
    const options = {
      props: ['foo', 'bar'],
      render(h) {
        return h('div', [this.foo + ',' + this.bar])
      }
    }

    const C = connect({
      stateToProps: {
        foo: 'foo'
      }
    })('example', options)

    const { wrapped } = mountContainer(store, C, {
      props: {
        bar: 'bar'
      }
    })
    assert(wrapped.$el.textContent === 'foo,bar')
  })

  it('should handle the props definition from mixins', () => {
    const mixin = {
      props: ['foo']
    }

    const options = {
      mixins: [mixin],
      props: ['bar'],
      render(h) {
        return h('div', [this.foo + ',' + this.bar])
      }
    }

    const C = connect()(options)

    const { wrapped } = mountContainer(store, C, {
      props: {
        foo: 'foo value',
        bar: 'bar value'
      }
    })
    assert(wrapped.$el.textContent === 'foo value,bar value')
  })

  it('should handle the props definition from extends option', () => {
    const superComp = {
      props: ['foo']
    }

    const options = {
      extends: superComp,
      props: ['bar'],
      render(h) {
        return h('div', [this.foo + ',' + this.bar])
      }
    }

    const C = connect()(options)

    const { wrapped } = mountContainer(store, C, {
      props: {
        foo: 'foo value',
        bar: 'bar value'
      }
    })
    assert(wrapped.$el.textContent === 'foo value,bar value')
  })

  it('should handle the props definition on super component', () => {
    const Super = Vue.extend({
      props: ['foo']
    })

    const Comp = Super.extend({
      props: ['bar'],
      render(h) {
        return h('div', [this.foo + ',' + this.bar])
      }
    })

    const C = connect()(Comp)

    const { wrapped } = mountContainer(store, C, {
      props: {
        foo: 'foo value',
        bar: 'bar value'
      }
    })
    assert(wrapped.$el.textContent === 'foo value,bar value')
  })
})

function mountContainer(store, Container, options = {}) {
  const root = new Vue({
    el: '#app',
    data: {
      show: true
    },
    store,
    render(h) {
      const slots = options.slots && options.slots(h)

      const scopedSlots = {}
      if (options.scopedSlots) {
        Object.keys(options.scopedSlots).forEach(key => {
          scopedSlots[key] = props => options.scopedSlots[key](h, props)
        })
      }

      return h('keep-alive', [
        this.show &&
          h(
            Container,
            {
              props: options.props,
              on: options.on,
              scopedSlots
            },
            slots
          )
      ])
    }
  })
  return {
    root,
    container: root.$children[0],
    wrapped: root.$children[0].$children[0]
  }
}
