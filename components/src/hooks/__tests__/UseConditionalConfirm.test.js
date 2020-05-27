// @flow
import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'
import { useConditionalConfirm } from '../useConditionalConfirm'

describe('useConditionalConfirm', () => {
  let conditionalContinue: () => mixed
  let requiresConfirmation: boolean
  let confirmAndContinue: () => mixed
  let cancelConfirm: () => mixed

  const TestUseConditionalConfirm = options => {
    ;({
      conditionalContinue,
      requiresConfirmation,
      confirmAndContinue,
      cancelConfirm,
    } = useConditionalConfirm(options.handleContinue, options.needConfirmation))

    return <span> test wrapper using useConditionalConfirm </span>
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should initially set requiresConfirmation to false', () => {
    const props = {
      handleContinue: jest.fn(),
      needConfirmation: true,
    }
    mount(<TestUseConditionalConfirm {...props} />)

    expect(requiresConfirmation).toBe(false)
  })

  it('should call handleContinue when calling confirmAndContinue', () => {
    const props = {
      handleContinue: jest.fn(),
      needConfirmation: true,
    }

    mount(<TestUseConditionalConfirm {...props} />)

    act(() => {
      confirmAndContinue()
    })

    expect(props.handleContinue).toHaveBeenCalled()
  })

  it('should set requiresConfirmation to false when calling confirmAndContinue', () => {
    const props = {
      handleContinue: jest.fn(),
      needConfirmation: true,
    }

    mount(<TestUseConditionalConfirm {...props} />)

    act(() => {
      confirmAndContinue()
    })

    expect(requiresConfirmation).toBe(false)
  })

  it('should NOT call handleContinue when calling cancelConfirm', () => {
    const props = {
      handleContinue: jest.fn(),
      needConfirmation: true,
    }

    mount(<TestUseConditionalConfirm {...props} />)

    act(() => {
      cancelConfirm()
    })

    expect(props.handleContinue).not.toHaveBeenCalled()
  })

  it('should set requiresConfirmation to false when calling cancelConfirm', () => {
    const props = {
      handleContinue: jest.fn(),
      needConfirmation: true,
    }

    mount(<TestUseConditionalConfirm {...props} />)

    act(() => {
      cancelConfirm()
    })

    expect(requiresConfirmation).toBe(false)
  })

  describe('when it needs confirmation', () => {
    it('should set requiresConfirmation to true after calling conditionalContinue', () => {
      const props = {
        handleContinue: jest.fn(),
        needConfirmation: true,
      }

      mount(<TestUseConditionalConfirm {...props} />)

      expect(requiresConfirmation).toBe(false)

      act(() => {
        conditionalContinue()
      })

      expect(requiresConfirmation).toBe(true)
    })

    it('should NOT call handleContinue after calling conditionalContinue ', () => {
      const props = {
        handleContinue: jest.fn(),
        needConfirmation: true,
      }

      mount(<TestUseConditionalConfirm {...props} />)

      act(() => {
        conditionalContinue()
      })

      expect(props.handleContinue).not.toHaveBeenCalled()
    })
  })
  describe('when it does NOT need confirmation', () => {
    it('should call handleContinue after calling conditionalContinue', () => {
      const props = {
        handleContinue: jest.fn(),
        needConfirmation: false,
      }

      mount(<TestUseConditionalConfirm {...props} />)

      act(() => {
        conditionalContinue()
      })

      expect(props.handleContinue).toHaveBeenCalled()
    })

    it('should NOT set requiresConfirmation to true after calling conditionalContinue ', () => {
      const props = {
        handleContinue: jest.fn(),
        needConfirmation: false,
      }

      mount(<TestUseConditionalConfirm {...props} />)

      act(() => {
        conditionalContinue()
      })

      expect(requiresConfirmation).toBe(false)
    })
  })
})
