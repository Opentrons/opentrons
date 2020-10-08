// @flow
// tests for the AppInfoCard
import * as React from 'react'
import { shallow } from 'enzyme'

import { Card, LabeledValue } from '@opentrons/components'
import { CURRENT_VERSION } from '../../../shell'
import { AppInfoCard } from '../AppInfoCard'

import type { AppInfoCardProps } from '../AppInfoCard'

describe('AppInfoCard', () => {
  const mockCheckUpdate = jest.fn()

  const render = ({
    checkUpdate = mockCheckUpdate,
    availableVersion = null,
  }: $Shape<AppInfoCardProps> = {}) => {
    return shallow(
      <AppInfoCard
        checkUpdate={checkUpdate}
        availableVersion={availableVersion}
      />
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should be a card with the correct title', () => {
    const wrapper = render()
    const card = wrapper.find(Card)

    expect(card.prop('title')).toBe('Information')
  })

  it('should have a labeled value with the current version', () => {
    const wrapper = render()
    const versionValue = wrapper.find(LabeledValue)

    expect(versionValue.prop('label')).toBe('Software Version')
    expect(versionValue.prop('value')).toBe(CURRENT_VERSION)
  })

  it.todo('should have a SecondaryBtn that is disabled if no update available')

  it.todo('clicking the SecondaryBtn should render an <UpdateAppModal>')
})
