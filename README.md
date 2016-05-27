# vuex-connect

[![npm version](https://badge.fury.io/js/vuex-connect.svg)](https://badge.fury.io/js/vuex-connect)
[![Build Status](https://travis-ci.org/ktsn/vuex-connect.svg?branch=travis)](https://travis-ci.org/ktsn/vuex-connect)

A binding utility for a Vue component and a Vuex store.  
Inspired by [react-redux](https://github.com/reactjs/react-redux)'s `connect` function.

## Example

First, you should create a Vue component.

```js
const HelloComponent = Vue.extend({
  props: {
    message: {
      type: String,
      required: true
    },
    updateInput: {
      type: Function,
      required: true
    }
  },
  template: `
  <div>
    <p>{{ message }}</p>
    <input type="text" :value="message" @input="updateInput">
  </div>
  `
});

export default HelloComponent;
```

You can bind the component and the Vuex store by vuex-connect.  
`connect` function wraps the component and create a new wrapper component.

```js
import { connect } from 'vuex-connect';
import HelloComponent from './hello-component';

const getters = {
  message: (state) => state.message
};

const actions = {
  updateInput: ({ dispatch }, event) => dispatch('UPDATE_INPUT', event.target.value)
};

const lifecycle = {
  ready: ({ dispatch }) => {
    fetch(URL)
      .then(res => res.text())
      .then(text => dispatch('UPDATE_INPUT', text));
  };
}

const HelloContainer = connect(
  getters,
  actions,
  lifecycle
)('hello', HelloComponent);

export default HelloContainer;
```

## API

### `connect([getters], [actions], [lifecycle]) -> (componentName, Component) -> WrappedComponent`

Connects a Vue component to a Vuex store.

`[getters]` and `[actions]` are same as Vuex getters and actions object that specified on a Vue component options.
The function binds getters and actions to component's props.

`[lifecycle]` is [lifecycle hooks](https://vuejs.org/api/#Options-Lifecycle-Hooks) for a Vue component.
The lifecycle hooks receives Vuex store for their first argument.
You can dispatch some actions in the lifecycle hooks.

`connect` returns another function. The function expects a component name and the component constructor.
The component name should be `string` and it is useful to specify the component on debug phase.

## License

MIT
