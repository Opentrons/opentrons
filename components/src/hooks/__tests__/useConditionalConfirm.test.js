// @flow
import { mount } from 'enzyme'
import * as React from 'react'
import { act } from 'react-dom/test-utils'

import { useConditionalConfirm } from '../useConditionalConfirm'

describe('useConditionalConfirm', () => {
  let confirm: () => mixed
  let showConfirmation: boolean
  let cancel: () => mixed

  const TestUseConditionalConfirm = options => {
    ;({ confirm, showConfirmation, cancel } = useConditionalConfirm(
      options.handleContinue,
      options.shouldBlock
    ))

    return <span> test wrapper using useConditionalConfirm </span>
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should initially set showConfirmation to false', () => {
    const props = {
      handleContinue: jest.fn(),
      shouldBlock: true,
    }
    mount(<TestUseConditionalConfirm {...props} />)

    expect(showConfirmation).toBe(false)
  })

  it('should NOT call handleContinue when calling cancel', () => {
    const props = {
      handleContinue: jest.fn(),
      shouldBlock: true,
    }

    mount(<TestUseConditionalConfirm {...props} />)

    act(() => {
      cancel()
    })

    expect(props.handleContinue).not.toHaveBeenCalled()
  })

  it('should set showConfirmation to false when calling cancel', () => {
    const props = {
      handleContinue: jest.fn(),
      shouldBlock: true,
    }

    mount(<TestUseConditionalConfirm {...props} />)

    act(() => {
      cancel()
    })

    expect(showConfirmation).toBe(false)
  })

  describe('when it should block the user', () => {
    describe('and the user has NOT yet confirmed', () => {
      it('should set showConfirmation to true after calling confirm', () => {
        const props = {
          handleContinue: jest.fn(),
          shouldBlock: true,
        }

        mount(<TestUseConditionalConfirm {...props} />)

        expect(showConfirmation).toBe(false)

        act(() => {
          confirm()
        })

        expect(showConfirmation).toBe(true)
      })

      it('should NOT call handleContinue after calling confirm ', () => {
        const props = {
          handleContinue: jest.fn(),
          shouldBlock: true,
        }

        mount(<TestUseConditionalConfirm {...props} />)

        act(() => {
          confirm()
        })

        expect(props.handleContinue).not.toHaveBeenCalled()
      })
    })

    describe('and the user has confirmed', () => {
      it('should call handleContinue after calling confirm', () => {
        const props = {
          handleContinue: jest.fn(),
          shouldBlock: true,
        }

        mount(<TestUseConditionalConfirm {...props} />)

        expect(showConfirmation).toBe(false)

        act(() => {
          confirm() // initial confirmation
        })

        act(() => {
          confirm() // we've already confirmed, go ahead!
        })

        expect(props.handleContinue).toHaveBeenCalled()
      })

      it('should set showConfirmation to false after calling confirm', () => {
        const props = {
          handleContinue: jest.fn(),
          shouldBlock: true,
        }

        mount(<TestUseConditionalConfirm {...props} />)

        act(() => {
          confirm() // initial confirmation
        })

        act(() => {
          confirm() // we've already confirmed, go ahead!
        })

        expect(showConfirmation).toBe(false)
      })
    })
  })
  describe('when it should NOT block the user', () => {
    it('should call handleContinue after calling confirm', () => {
      const props = {
        handleContinue: jest.fn(),
        shouldBlock: false,
      }

      mount(<TestUseConditionalConfirm {...props} />)

      act(() => {
        confirm()
      })

      expect(props.handleContinue).toHaveBeenCalled()
    })

    it('should NOT set showConfirmation to true after calling confirm ', () => {
      const props = {
        handleContinue: jest.fn(),
        shouldBlock: false,
      }

      mount(<TestUseConditionalConfirm {...props} />)

      act(() => {
        confirm()
      })

      expect(showConfirmation).toBe(false)
    })
  })
})
