# vuex-connect

[![npm version](https://badge.fury.io/js/vuex-connect.svg)](https://badge.fury.io/js/vuex-connect)
[![Build Status](https://travis-ci.org/ktsn/vuex-connect.svg?branch=travis)](https://travis-ci.org/ktsn/vuex-connect)

> vuex-connect v1 no longer supports Vuex <= v1. If you want to use with Vuex v1, please use vuex-connect v0.x

A binding utility for a Vue component and a Vuex store.  
Inspired by [react-redux](https://github.com/reactjs/react-redux)'s `connect` function.

## Example

First, create a Vue component. This component can communicate to a parent component using events and recieve data from the parent through props.

```js
// hello-component.js
export default {
  props: {
    message: {
      type: String,
      required: true
    }
  },
  methods: {
    updateMessage(event) {
      this.$emit('update', event.target.value)
    }
  },
  template: `
  <div>
    <p>{{ message }}</p>
    <input type="text" :value="message" @input="updateMessage">
  </div>
  `
}
```

You can bind the component and the Vuex store by `vuex-connect`.  
The `connect` function wraps the component, returning a new wrapper component.

```js
import { connect } from 'vuex-connect'
import HelloComponent from './hello-component'

export default connect({
  stateToProps: {
    message: state => state.message
  },

  methodsToEvents: {
    update: ({ commit }, value) => commit('UPDATE_INPUT', value)
  },

  lifecycle: {
    mounted: ({ commit }) => {
      fetch(URL)
        .then(res => res.text())
        .then(value => commit('UPDATE_INPUT', value));
    }
  }
})('hello', HelloComponent)
```

You can use getters, actions and mutations if you define them in your store.

```js
import { connect } from 'vuex-connect'
import HelloComponent from './hello-component'

export default connect({
  gettersToProps: {
    message: 'inputMessage' // 'prop name': 'getter name'
  },

  mutationsToEvents: {
    update: 'UPDATE_INPUT' // 'event name': 'mutation type'
  },

  lifecycle: {
    mounted: store => store.dispatch('FETCH_INPUT', URL)
  }
})('hello', HelloComponent)
```

## API

### `connect(options) -> (componentName, Component) -> WrapperComponent`

- `options`: Object
  - `stateToProps`
  - `gettersToProps`
  - `actionsToProps`
  - `actionsToEvents`
  - `mutationsToProps`
  - `mutationsToEvents`
  - `methodsToProps`
  - `methodsToEvents`
  - `lifecycle`
- `componentName`: string
- `Component`: Vue component or component option
- `WrapperComponent`: Vue component

Connects a Vue component to a Vuex store.

`stateToProps`, `gettersToProps`, `actionsTo(Props|Events)` and `mutationsTo(Props|Events)` have the same interface as Vuex's `mapState`, `mapGetters`, `mapActions` and `mapMutations`. In addition, you can define inline methods by using `methodsTo(Props|Events)`.

The options suffixed by `Props` indicate that they will be passed to the wrapped component's props. For example, the following option retrieves a store's state via the `inputMessage` getter and passes it to the `message` prop of the wrapped component.

```js
connect({
  gettersToProps: {
    message: 'inputMessage'
  }
})
```

The options suffixed by `Events` indicate that they will listen to the wrapped component's events. For example, the following option observes the `update` event of the wrapped component and if it is emitted, the `UPDATE_INPUT` mutation is committed.

```js
connect({
  mutationsToEvents: {
    update: 'UPDATE_INPUT'
  }
})
```

`lifecycle` is [lifecycle hooks](https://vuejs.org/api/#Options-Lifecycle-Hooks) for a Vue component.
The lifecycle hooks receive a Vuex store for their first argument. You can dispatch some actions or mutations in the lifecycle hooks.

`connect` returns another function. The function expects a component name and the component constructor. The component name should be a `string`. It is useful to specify the component in the debug phase.

### `createConnect(fn) -> ConnectFunction`

Creates a customized `connect` function. `fn` is transform function of the wrapper component options and will receive a component options object and a lifecycle option of the connect function. You may want to inject some additional lifecycle hooks in `fn`.

Example of defining `vue-router` lifecycle hooks:

```js
// connect.js
import { createConnect } from 'vuex-connect'

export const connect = createConnect((options, lifecycle) => {
  options.beforeRouteEnter = lifecycle.beforeRouteEnter

  options.beforeRouteUpdate = function(to, from, next) {
    return lifecycle.beforeRouteUpdate.call(this, this.store, to, from, next)
  }

  options.beforeRouteLeave = function(to, from, next) {
    return lifecycle.beforeRouteLeave.call(this, this.store, to, from, next)
  }
})
```

It can be used as:

```js
import { connect } from './connect'
import { Example } from './example'

export default connect({
  lifecycle: {
    beforeRouteEnter(to, from, next) {
      // ...
    },

    beforeRouteUpdate(store, to, from, next) {
      // ...
    },

    beforeRouteLeave(store, to, from, next) {
      // ...
    }
  }
})('example', Example)
```

## License

MIT
