// @flow
import { uiInitialized } from '../actions'

describe('shell actions', () => {
  it('should be able to create a UI_INITIALIZED action', () => {
    expect(uiInitialized()).toEqual({
      type: 'shell:UI_INITIALIZED',
      meta: { shell: true },
    })
  })
})
