import assert from 'power-assert'
import Vue from 'vue'
import Vuex from 'vuex'
import { createConnect } from '../src'

describe('createConnect', () => {
  const store = new Vuex.Store({
    state: {
      value: 'foobar',
    },
  })

  it('creates connect helper', () => {
    const connect = createConnect(() => {})
    assert(typeof connect === 'function')
  })

  it('transforms component options with lifecycle options', (done) => {
    const connect = createConnect((options, lifecycle) => {
      options.foo = function (arg) {
        lifecycle.foo.call(this, this.$store, arg)
      }
    })

    const Comp = connect({
      lifecycle: {
        foo(store, arg) {
          assert(this instanceof Vue)
          assert(store instanceof Vuex.Store)
          assert(arg === 'test')
          done()
        },
      },
    })(Vue.extend({}))

    const c = new Comp({
      store,
    })
    c.$options.foo.call(c, 'test')
  })
})
