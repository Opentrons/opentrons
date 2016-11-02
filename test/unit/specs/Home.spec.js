import { expect } from 'chai'

import Vue from 'vue'
import store from '../../../app/renderer/src/store/store'
import Home from '../../../app/renderer/src/components/Home.vue'

describe('Home.vue', () => {
  it('should render home page with title', () => {
    const vm = new Vue({
      store,
      ...Home
    }).$mount('#app')
    console.log(vm)
    expect(vm.$el.querySelector('#app-title').textContent).to.equal('Logo')
    expect(1).to.equal(1)
  })
})
