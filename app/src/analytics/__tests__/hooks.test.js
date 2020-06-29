// @flow
import { mount } from 'enzyme'
import noop from 'lodash/noop'
import * as React from 'react'
import { Provider } from 'react-redux'

import * as Cfg from '../../config'
import type { Config } from '../../config/types'
import type { State } from '../../types'
import { useTrackEvent } from '../hooks'
import * as Mixpanel from '../mixpanel'
import type { AnalyticsConfig, AnalyticsEvent } from '../types'

jest.mock('../../config')
jest.mock('../mixpanel')

const getConfig: JestMockFn<[State], $Shape<Config> | null> = Cfg.getConfig
const trackEvent: JestMockFn<[AnalyticsEvent, AnalyticsConfig], void> =
  Mixpanel.trackEvent

const MOCK_STATE: State = ({ mockState: true }: any)

const MOCK_ANALYTICS_CONFIG = {
  appId: 'abc',
  optedIn: true,
  seenOptIn: true,
}

describe('analytics hooks', () => {
  beforeEach(() => {
    getConfig.mockImplementation(state => {
      expect(state).toBe(MOCK_STATE)
      return { analytics: MOCK_ANALYTICS_CONFIG }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('useTrackEvent', () => {
    let trackEventResult

    const TestTrackEvent = () => {
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
