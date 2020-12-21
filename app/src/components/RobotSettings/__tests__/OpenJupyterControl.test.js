// @flow
import * as React from 'react'
import { mountWithProviders } from '@opentrons/components/__utils__'
import { SecondaryBtn } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Analytics from '../../../analytics'
import { OpenJupyterControl } from '../OpenJupyterControl'

import type { AnalyticsEvent } from '../../../analytics/types'

jest.mock('../../../analytics')

const useTrackEvent: JestMockFn<[], (AnalyticsEvent) => void> =
  Analytics.useTrackEvent

describe('OpenJupyterControl component', () => {
  const render = () =>
    mountWithProviders(<OpenJupyterControl robotIp="localhost" />, { i18n })
  const trackEvent = jest.fn()

  beforeEach(() => {
    useTrackEvent.mockReturnValue(trackEvent)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a labeled value', () => {
    const { wrapper } = render()
    const control = wrapper.find('LabeledValue')

    expect(control.prop('label')).toBe('Jupyter Notebook')
    expect(control.find('a[href="https://jupyter.org/"]').exists()).toBe(true)
    expect(
      control
        .find(
          'a[href="https://docs.opentrons.com/v2/new_advanced_running.html#jupyter-notebook"]'
        )
        .exists()
    ).toBe(true)
  })

  it('should render an external link styled as a SecondaryBtn', () => {
    const { wrapper } = render()
    const button = wrapper.find(SecondaryBtn)
    const link = button.find('a[href="http://localhost:48888"]')

    expect(link.text()).toBe('open')
    expect(link.prop('target')).toBe('_blank')
    expect(link.prop('rel')).toBe('noopener noreferrer')
  })

  it('should send an analytics event on link click', () => {
    const { wrapper } = render()

    wrapper.find('a[href="http://localhost:48888"]').invoke('onClick')()

    expect(trackEvent).toHaveBeenCalledWith({
      name: 'jupyterOpen',
      properties: {},
    })
  })
})
