# vuex-connect

A binding utility for a Vue component and a Vuex store.
Inspired by [react-redux](https://github.com/reactjs/react-redux)'s `connect` function.

## Usage
```js
/* Setup
----------------------------------------*/
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const state = {
  message: 'Hello World!'
};

const mutations = {
  UPDATE_INPUT(state, value) {
    state.message = value;
  }
};

const store = new Vuex.Store({
  state,
  mutations
});

/* Component
----------------------------------------*/
const Hello = Vue.extend({
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
  <p>{{ message }}</p>
  <input type="text" :value="message" @input="updateInput">
  `
});

/* Container
----------------------------------------*/
import { connect } from 'vuex-connect';

const getters = {
  message: (state) => state.message
};

const actions = {
  updateInput: ({ dispatch }, event) => dispatch('UPDATE_INPUT', event.target.value)
};

const HelloContainer = connect(
  getters,
  actions
)('hello', Hello);
```

## License

MIT
