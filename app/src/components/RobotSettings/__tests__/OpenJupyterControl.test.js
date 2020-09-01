// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { SecondaryBtn } from '@opentrons/components'

import * as Analytics from '../../../analytics'
import { TitledControl } from '../../TitledControl'
import { OpenJupyterControl } from '../OpenJupyterControl'

import type { AnalyticsEvent } from '../../../analytics/types'

jest.mock('../../../analytics')

const useTrackEvent: JestMockFn<[], (AnalyticsEvent) => void> =
  Analytics.useTrackEvent

describe('OpenJupyterControl component', () => {
  const render = () => mount(<OpenJupyterControl ip="localhost" />)
  const trackEvent = jest.fn()

  beforeEach(() => {
    useTrackEvent.mockReturnValue(trackEvent)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a TitledControl', () => {
    const wrapper = render()
    const control = wrapper.find(TitledControl)

    expect(control.prop('title')).toBe('Jupyter Notebook')
    expect(control.prop('description')).toMatch(/Open .+ Jupyter Notebook/)
  })

  it('should render an external link styled as a SecondaryBtn', () => {
    const wrapper = render()
    const button = wrapper.find(SecondaryBtn)
    const link = button.find('a')

    expect(link.text()).toBe('Open')
    expect(link.prop('href')).toBe('http://localhost:48888')
    expect(link.prop('target')).toBe('_blank')
    expect(link.prop('rel')).toBe('noopener noreferrer')
  })

  it('should send an analytics event on link click', () => {
    const link = render().find('a')

    link.invoke('onClick')()

    expect(trackEvent).toHaveBeenCalledWith({
      name: 'jupyterOpen',
      properties: {},
    })
  })
})
