import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import noop from 'lodash/noop'

import * as Cfg from '../../config'
import * as Mixpanel from '../mixpanel'
import { useTrackEvent } from '../hooks'

import type { State } from '../../types'
import type { Config } from '../../config/types'

jest.mock('../../config')
jest.mock('../mixpanel')

const getConfig = Cfg.getConfig as jest.MockedFunction<typeof Cfg.getConfig>
const trackEvent = Mixpanel.trackEvent as jest.MockedFunction<
  typeof Mixpanel.trackEvent
>

const MOCK_STATE: State = { mockState: true } as any

const MOCK_ANALYTICS_CONFIG = {
  appId: 'abc',
  optedIn: true,
  seenOptIn: true,
}

describe('analytics hooks', () => {
  beforeEach(() => {
    getConfig.mockImplementation((state: State) => {
      expect(state).toBe(MOCK_STATE)
      return { analytics: MOCK_ANALYTICS_CONFIG } as Config
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('useTrackEvent', () => {
    let trackEventResult: ReturnType<typeof useTrackEvent>

    const TestTrackEvent = (): JSX.Element => {
      trackEventResult = useTrackEvent()
      return <></>
    }

    const render = () => {
      return mount(<TestTrackEvent />, {
        wrappingComponent: Provider,
        wrappingComponentProps: {
          store: {
            subscribe: noop,
            dispatch: noop,
            getState: () => MOCK_STATE,
          },
        },
      })
    }

    it('should return a trackEvent function with config bound from state', () => {
      const event = { name: 'someEvent', properties: { foo: 'bar' } }

      render()
      trackEventResult(event)

      expect(trackEvent).toHaveBeenCalledWith(event, MOCK_ANALYTICS_CONFIG)
    })

    it('should noop if config not loaded', () => {
      const event = { name: 'someEvent', properties: { foo: 'bar' } }

      getConfig.mockReturnValue(null)
      render()
      trackEventResult(event)

      expect(trackEvent).toHaveBeenCalledTimes(0)
    })
  })
})
