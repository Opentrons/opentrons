/* global describe, it */
import { expect } from 'chai'
import sinon from 'sinon'


import wsp from 'renderer/store/websocket-plugin'
const { handleJupyterUpload } = wsp


describe('websocket-plugin', () => {
  it('updates task list when jupyter upload data is sent', () => {
    const store = sinon.spy()
    store.commit = sinon.spy()

    const data = {
      data: {
        calibrations: [],
        fileName: 'test jupyter',
        lastModified: null
      }
    }
    handleJupyterUpload(store, data)
    expect(store.commit.called).to.be.true
  })
})
