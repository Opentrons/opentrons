import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import noop from 'lodash/noop'

import * as Selectors from '../selectors'
import { useFeatureFlag } from '../hooks'

jest.mock('../selectors')

const getFeatureFlags = Selectors.getFeatureFlags as jest.MockedFunction<
  typeof Selectors.getFeatureFlags
>

describe('config hooks', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('useFeatureFlag', () => {
    let result: boolean
    const TestUseFeatureFlag = (props: { flag: any }) => {
      result = useFeatureFlag(props.flag)
      return <></>
    }

    const mockStore = {
      getState: () => ({ mockState: true } as any),
      dispatch: noop,
      subscribe: noop,
    }

    const render = (flag: string) => {
      return mount(<TestUseFeatureFlag flag={flag} />, {
        wrappingComponent: Provider,
        wrappingComponentProps: { store: mockStore },
      })
    }

    it('should return false if the feature flag is not set', () => {
      getFeatureFlags.mockReturnValue({})

      render('someFlag')
      expect(result).toBe(false)
    })

    it('should return false if the feature flag is set to false', () => {
      getFeatureFlags.mockReturnValue({ someFlag: false } as any)

      render('someFlag')
      expect(result).toBe(false)
    })

    it('should return false if the feature flag is set to falsey', () => {
      getFeatureFlags.mockReturnValue({ someFlag: 0 as any } as any)

      render('someFlag')
      expect(result).toBe(false)
    })

    it('should return true if the feature flag is set', () => {
      getFeatureFlags.mockReturnValue({ someFlag: true } as any)

      render('someFlag')
      expect(result).toBe(true)
    })

    it('should return true if the feature flag is set to truthy', () => {
      getFeatureFlags.mockReturnValue({ someFlag: 1 as any } as any)

      render('someFlag')
      expect(result).toBe(true)
    })
  })
})
