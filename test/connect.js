import assert from 'power-assert';
import { setup, teardown } from './stub/dom';

import { connect } from '../src/connect';

import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

window.addEventListener('DOMContentLoaded', () => {
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
