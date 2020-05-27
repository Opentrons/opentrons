// @flow
import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'
import { useConditionalConfirm } from '../useConditionalConfirm'

describe('useConditionalConfirm', () => {
  let conditionalContinue: () => mixed
  let showConfirmation: boolean
  let confirmAndContinue: () => mixed
  let cancelConfirm: () => mixed

  const TestUseConditionalConfirm = options => {
    ;({
      conditionalContinue,
      showConfirmation,
      confirmAndContinue,
      cancelConfirm,
    } = useConditionalConfirm(options.handleContinue, options.needConfirmation))

    return <span> test wrapper using useConditionalConfirm </span>
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should initially set showConfirmation to false', () => {
    const props = {
      handleContinue: jest.fn(),
      needConfirmation: true,
    }
    mount(<TestUseConditionalConfirm {...props} />)

    expect(showConfirmation).toBe(false)
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

  it('should set showConfirmation to false when calling confirmAndContinue', () => {
    const props = {
      handleContinue: jest.fn(),
      needConfirmation: true,
    }

    mount(<TestUseConditionalConfirm {...props} />)

    act(() => {
      confirmAndContinue()
    })

    expect(showConfirmation).toBe(false)
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

  it('should set showConfirmation to false when calling cancelConfirm', () => {
    const props = {
      handleContinue: jest.fn(),
      needConfirmation: true,
    }

    mount(<TestUseConditionalConfirm {...props} />)

    act(() => {
      cancelConfirm()
    })

    expect(showConfirmation).toBe(false)
  })

  describe('when it needs confirmation', () => {
    it('should set showConfirmation to true after calling conditionalContinue', () => {
      const props = {
        handleContinue: jest.fn(),
        needConfirmation: true,
      }

      mount(<TestUseConditionalConfirm {...props} />)

      expect(showConfirmation).toBe(false)

      act(() => {
        conditionalContinue()
      })

      expect(showConfirmation).toBe(true)
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

    it('should NOT set showConfirmation to true after calling conditionalContinue ', () => {
      const props = {
        handleContinue: jest.fn(),
        needConfirmation: false,
      }

      mount(<TestUseConditionalConfirm {...props} />)

      act(() => {
        conditionalContinue()
      })

      expect(showConfirmation).toBe(false)
    })
  })
})
