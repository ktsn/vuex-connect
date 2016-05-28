import assert from 'power-assert';
import { setup, teardown } from './stub/dom';

import { connect } from '../src/connect';

import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

describe('connect', () => {
  let state, mutations, store, Component;

  beforeEach(() => {
    setup();

    state = {
      foo: 'bar',
      bar: 5,
      baz: true
    };

    mutations = {
      UPDATE_FOO(state, value) { state.foo = value; },
      UPDATE_BAR(state, value) { state.bar = value; }
    };

    store = new Vuex.Store({ state, mutations });

    Component = Vue.extend({
      props: ['a', 'b', 'c'],
      template: `
      <div>
        <div id="component-prop-1">{{ a }}</div>
        <div id="component-prop-2">{{ b }}</div>
      </div>`
    });
  });

  afterEach(teardown);

  it('returns wrapped Vue component', () => {
    const actual = connect()('example', Component);
    assert(typeof actual === 'function');
  });

  it('sets name to given component', () => {
    const Container = connect()('test', Component);
    const container = mountContainer(store, Container);
    const actual = container.$children[0];

    assert(actual.$options.name === 'test');
  });

  it('binds getter functions', () => {
    const Container = connect({
      a: (state) => state.foo,
      b: (state) => state.bar
    })('example', Component);

    const actual = mountContainer(store, Container);

    assert(actual.a === 'bar');
    assert(actual.b === 5);
  });

  it('binds actions', () => {
    const Container = connect(null, {
      c: ({ dispatch }, value) => dispatch('UPDATE_FOO', value)
    })('example', Component);

    const actual = mountContainer(store, Container);

    assert(store.state.foo === 'bar');
    actual.c('baz');
    assert(store.state.foo === 'baz');
  });

  it('binds getter values to component props', (done) => {
    const Container = connect({
      a: (state) => state.foo,
      b: (state) => state.bar + 3,
      z: (state) => state.baz
    })('example', Component);

    const container = mountContainer(store, Container);
    const actual = container.$children[0];

    assert(actual.a === 'bar');
    assert(actual.b === 8);
    assert(actual.z === undefined); // z is not registered on props

    store.state.foo = 'baz';

    actual.$nextTick(() => {
      // ensure the props can detect changes
      assert(actual.a === 'baz');
      done();
    });
  });

  it('binds actions to component props', () => {
    const Container = connect(null, {
      c: ({ dispatch }, value) => dispatch('UPDATE_BAR', value * 2)
    })('example', Component);

    const container = mountContainer(store, Container);
    const actual = container.$children[0];

    assert(store.state.bar === 5);
    actual.c(10);
    assert(store.state.bar === 20);
  });

  it('injects all lifecycle hooks', () => {
    let C;
    let count = 0;

    const init = (_store) => { assert(_store === void 0); count++; };
    const created = function() { assert(this instanceof C); count++; };
    const beforeCompile = (_store) => { assert(_store === store); count++; };
    const compiled = () => count++;
    const ready = () => count++;
    const attached = () => count++;
    const detached = () => count++;
    const beforeDestroy = () => count++;
    const destroyed = (_store) => { assert(_store === store); count++; };

    C = connect(null, null, {
      init, created, beforeCompile, compiled,
      ready, attached, detached, beforeDestroy, destroyed
    })('example', Component);

    const c = mountContainer(store, C);
    c.$remove();
    c.$destroy();

    assert(count === 9);
  });

  it('does not allow other than lifecycle hooks', () => {
    const a = s => s.foo;
    const b = s => s.state.bar;

    const C = connect({
      a: a
    }, {
      b: b
    }, {
      a: 1,
      b: 1,
      methods: {
        c: () => 1
      },
      vuex: {
        getters: {
          a: s => s.bar,
          d: () => 1
        },
        actions: {
          b: s => s.state.foo,
          e: () => 1
        }
      }
    })('example', Component);

    const c = mountContainer(store, C);

    assert(c.a === a(store.state));
    assert(c.b() === b(store));
    assert(c.c === void 0);
    assert(c.d === void 0);
    assert(c.e === void 0);
    assert(c.foo === void 0);
  });
});

function mountContainer(store, Container) {
  const app = new Vue({
    el: '#app',
    store,
    components: {
      example: Container
    }
  });
  return app.$children[0];
}
