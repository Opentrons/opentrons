import { expect } from 'chai'

import Vue from 'vue'
import store from '../../../app/renderer/src/store/store'
import Home from '../../../app/renderer/src/components/Home.vue'

describe('Home.vue', () => {
  it('should render home page child nodes', () => {
    const vm = new Vue({
      store,
      ...Home
    }).$mount('#app')
    console.log(vm.$el)
    expect(vm.$el.querySelector('nav').hasChildNodes()).to.equal(true)
    expect(vm.$el.querySelector('nav').textContent.to.equal('Home: ')
  })
})
