/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import Home from 'renderer/components/Home.vue'

describe('Home.vue', () => {
  it('should render home page child nodes', () => {
    const vm = new Vue({
      el: document.createElement('div'),
      render: h => h(Home)
    }).$mount()
    expect(vm.$el.querySelector('nav span.label').textContent).to.equal('HOME: ')
    expect(vm.$el.querySelector('nav span').hasChildNodes()).to.equal(true)
  })
})
