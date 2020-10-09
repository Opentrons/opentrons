// @flow
// app settings page component
import * as React from 'react'
import { shallow } from 'enzyme'

import { Page } from '../../../components/Page'
import { AnalyticsSettingsCard } from '../../../components/analytics-settings'
import {
  AppSoftwareSettingsCard,
  AppAdvancedSettingsCard,
} from '../../../components/app-settings'

import { AppSettings } from '../AppSettings'

describe('/more/app page component', () => {
  it('should render a Page with the correct title', () => {
    const wrapper = shallow(<AppSettings />)

    expect(wrapper.find(Page).prop('titleBarProps')).toEqual({
      title: 'App',
    })
  })

  it('renders an AppSoftwareSettingsCard', () => {
    const wrapper = shallow(<AppSettings />)

    expect(wrapper.exists(AppSoftwareSettingsCard)).toBe(true)
  })

  it('renders a AnalyticsSettingsCard', () => {
    const wrapper = shallow(<AppSettings />)

    expect(wrapper.exists(AnalyticsSettingsCard)).toBe(true)
  })

  it('renders an AppAdvancedSettingsCard', () => {
    const wrapper = shallow(<AppSettings />)

    expect(wrapper.exists(AppAdvancedSettingsCard)).toBe(true)
  })
})
