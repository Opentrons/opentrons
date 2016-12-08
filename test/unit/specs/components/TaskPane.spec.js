/* global describe, it */
import { expect } from 'chai'
import Vue from 'vue'
import { getRenderedVm } from '../../util.js'

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
const propsData = { busy: false }
const taskPane = getRenderedVm(TaskPane, propsData, mockStore)
const busyProps = { busy: true }
const busyTaskPane = getRenderedVm(TaskPane, busyProps, mockStore)

describe('TaskPane.vue', (done) => {
  it('only shows the task pane section when not running', () => {
    expect(taskPane.running()).to.be.true
    const taskPaneSelector = taskPane.$el.querySelector('#task-pane')
    expect(taskPaneSelector.style.display).to.equal('none')

    const busyTaskPaneSelector = busyTaskPane.$el.querySelector('#task-pane')
    Vue.nextTick(() => {
      expect(busyTaskPaneSelector.style.display).to.equal('')
    })
  })

  it('only shows the run screen when running', () => {
    expect(taskPane.running()).to.be.true
    const taskPaneSelector = taskPane.$el.querySelector('.run-screen')
    expect(taskPaneSelector.style.display).to.equal('')
  })

  it('enables the routerview based on the busy prop', () => {
    expect(busyTaskPane.running()).to.be.true
    const busyRunScreenSelector = busyTaskPane.$el.querySelector('.run-screen')
    expect(busyRunScreenSelector.style.display).to.equal('')
  })

  it('disables the routerview based on the busy prop', () => {
    const newStore = getMockStore()
    newStore.state.protocolFinished = false
    const nonRunningTaskPane = getRenderedVm(TaskPane, propsData, newStore)
    const runSelector = nonRunningTaskPane.$el.querySelector('.run-screen')

    expect(nonRunningTaskPane.running()).to.be.false
    expect(runSelector.style.display).to.equal('none')
  })
})
