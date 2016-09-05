import assert from 'power-assert'
import { setup, teardown } from './stub/dom'

import { connect } from '../src/connect'

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

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
      [TEST]({ commit }, value) { commit('TEST', value + value) }
    }

    mutations = {
      [TEST](state, value) { state.foo = value }
    }

    store = new Vuex.Store({ state, getters, actions, mutations })

    options = {
      props: ['a', 'b', 'foo', TEST],
      render(h) {
        return h('div')
      }
    }

    Component = Vue.extend(options)
  })

  afterEach(teardown)

  it('returns wrapped Vue component', () => {
    const actual = connect()('example', Component)
    assert(typeof actual === 'function')
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
        a: (state) => state.foo
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
      mutationsToEvents: [TEST]
    })('example', Component)

    const { wrapped } = mountContainer(store, Container)

    assert(wrapped.foo === 'foo')
    wrapped.$emit(TEST, 'bar')

    Vue.nextTick(() => {
      assert(wrapped.foo === 'bar')
      done()
    })
  })

  it('injects lifecycle hooks', (done) => {
    let C
    let count = 0

    function _assert(_store) {
      assert(_store === store)
      assert(this instanceof C)
      count++
    }

    // TODO: test activated and deactivated hooks
    C = connect({
      lifecycle: {
        beforeCreate: _assert,
        created: _assert,
        beforeDestroy: _assert,
        destroyed: _assert,
        beforeMount: _assert,
        mounted: _assert,
        beforeUpdate: _assert,
        updated: _assert
      }
    })('example', Component)

    const { container } = mountContainer(store, C)
    container.$forceUpdate()

    Vue.nextTick(() => {
      container.$destroy()
      assert(count === 8)
      done()
    })
  })

  it('passes container props to component props if no getters and actions are specified', () => {
    const C = connect({
      gettersToProps: {
        a: 'foo'
      }
    })('example', Component)

    const { container } = mountContainer(store, C, { a: 1, b: 'test' })

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
})

function mountContainer(store, Container, props) {
  const root = new Vue({
    el: '#app',
    data: {
      show: true
    },
    store,
    render(h) {
      return (
        h('keep-alive', [
          this.show && h(Container, { props })
        ])
      )
    }
  })
  return {
    root,
    container: root.$children[0],
    wrapped: root.$children[0].$children[0]
  }
}
