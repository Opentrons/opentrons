// @flow
import { uiInitialzed } from '../actions'

describe('shell actions', () => {
  it('should be able to create a UI_INITIALIZED action', () => {
    expect(uiInitialized()).toEqual({
      type: 'shell:UI_INITIALZED',
      meta: { shell: true },
    })
  })
})
