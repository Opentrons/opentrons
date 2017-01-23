/* global describe, it */
import { expect } from 'chai'
import sinon from 'sinon'
import Vue from 'vue'
import Run from 'renderer/components/Run.vue'
import { getRenderedVm } from '../../util.js'

function getMockStore () {
  return {
    state: {
      running: false,
      paused: false,
      isConnected: true,
      tasks: [
        { placeables: [{ calibrated: true }, { calibrated: true }] },
        { placeables: [{ calibrated: true }, { calibrated: true }] }
      ]
    },
    actions: {
      runProtocol: sinon.spy(),
      pauseProtocol: sinon.spy(),
      resumeProtocol: sinon.spy(),
      cancelProtocol: sinon.spy()
    }
  }
}

const mockStore = getMockStore()
const run = getRenderedVm(Run, {}, mockStore)

describe('Run.vue', () => {
  it('enables everything when calibrated', () => {
    let buttons = run.$el.querySelectorAll('.disabled')
    expect(buttons.length).to.equal(0)
  })

  it('disables everything when not calibrated', () => {
    let uncalibratedStore = getMockStore()
    uncalibratedStore.state.tasks[0].placeables[0].calibrated = false
    const uncalibratedRun = getRenderedVm(Run, {}, uncalibratedStore)
    let uncalibratedButtons = uncalibratedRun.$el.querySelectorAll('.disabled')
    Vue.nextTick(() => {
      expect(uncalibratedButtons.length).to.equal(1)
    })
  })

  it('toggles run and cancel based on running being false', () => {
    let btnRun = run.$el.querySelector('.btn-run')
    let btnClear = run.$el.querySelector('.btn-clear')
    expect(btnRun.style.display).to.equal('')
    expect(btnClear.style.display).to.equal('none')
  })

  it('toggles run and cancel based on running being true', () => {
    const nonRunningStore = getMockStore()
    nonRunningStore.state.running = true
    const nonRunningRun = getRenderedVm(Run, {}, nonRunningStore)
    let btnRun = nonRunningRun.$el.querySelector('.btn-run')
    let btnClear = nonRunningRun.$el.querySelector('.btn-clear')
    expect(btnRun.style.display).to.equal('none')
    expect(btnClear.style.display).to.equal('')
  })

  it('hides pause and resume when not running', () => {
    let btnPause = run.$el.querySelector('.btn-pause')
    let btnResume = run.$el.querySelector('.btn-play')
    expect(btnPause.style.display).to.equal('none')
    expect(btnResume.style.display).to.equal('none')
  })

  it('enables pause and disables resume based on pause being true', () => {
    const nonPausedStore = getMockStore()
    nonPausedStore.state.paused = true
    nonPausedStore.state.running = true
    const nonPausedRun = getRenderedVm(Run, {}, nonPausedStore)
    let btnPause = nonPausedRun.$el.querySelector('.btn-pause')
    let btnResume = nonPausedRun.$el.querySelector('.btn-play')
    expect(btnPause.style.display).to.equal('none')
    expect(btnResume.style.display).to.equal('')
  })

  it('disables pause and enables resume based on pause being false', () => {
    const pausedStore = getMockStore()
    pausedStore.state.paused = false
    pausedStore.state.running = true
    const pausedRun = getRenderedVm(Run, {}, pausedStore)
    let btnPause = pausedRun.$el.querySelector('.btn-pause')
    let btnResume = pausedRun.$el.querySelector('.btn-play')
    expect(btnPause.style.display).to.equal('')
    expect(btnResume.style.display).to.equal('none')
  })

  it('clicking each button dispatches the correct action', () => {
    expect(mockStore.actions.runProtocol.called).to.be.false
    expect(mockStore.actions.cancelProtocol.called).to.be.false
    expect(mockStore.actions.pauseProtocol.called).to.be.false
    expect(mockStore.actions.resumeProtocol.called).to.be.false
    let btnRun = run.$el.querySelector('.btn-run')
    let btnClear = run.$el.querySelector('.btn-clear')
    let btnPause = run.$el.querySelector('.btn-pause')
    let btnResume = run.$el.querySelector('.btn-play')
    btnRun.click()
    expect(mockStore.actions.runProtocol.calledOnce).to.be.true
    btnClear.click()
    expect(mockStore.actions.cancelProtocol.calledOnce).to.be.true
    btnPause.click()
    expect(mockStore.actions.pauseProtocol.calledOnce).to.be.true
    btnResume.click()
    expect(mockStore.actions.resumeProtocol.calledOnce).to.be.true
  })
})
