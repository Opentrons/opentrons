/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'

Vue.use(Vuex)
Vue.use(VueRouter)

const router = new VueRouter({})
const TaskPaneInjector = require('!!vue?inject!renderer/components/TaskPane.vue')
const TaskPane = TaskPaneInjector({
  './StepList.vue': {
    template: '<div>StepList</div>'
  },
  './RunScreen.vue': {
    template: '<div>RunScreen</div>'
  }
})

function getMockStore () {
  return {
    state: {
      running: false,
      protocolFinished: true
    }
  }
}

const mockStore = getMockStore()

function getRenderedVm (Component, propsData, store) {
  const Ctor = Vue.extend(Component)
  return new Ctor({
    propsData,
    router,
    store: new Vuex.Store(store)
  }).$mount()
}

const propsData = { busy: false }
const taskPane = getRenderedVm(TaskPane, propsData, mockStore)

describe('TaskPane.vue', (done) => {
  it('only shows the task pane section when not running', () => {
    expect(taskPane.running()).to.be.true
    const taskPaneSelector = taskPane.$el.querySelector('#task-pane')
    expect(taskPaneSelector.style.display).to.equal('none')

    const busyProps = { busy: true }
    const busyTaskPane = getRenderedVm(TaskPane, busyProps, mockStore)
    const busyTaskPaneSelector = busyTaskPane.$el.querySelector('#task-pane')
    Vue.nextTick(() => {
      expect(busyTaskPaneSelector.style.display).to.equal('')
    })
  })

  it('only shows the run screen when running', () => {
    // expect(taskPane.runPercent()).to.equal(33)
  })

  it('disable the routerview based on the busy prop', () => {
    // expect(taskPane.runPercent()).to.equal(33)
  })
})
