// @flow
// tests for the AppSoftwareSettingsCard
import * as React from 'react'

import { mountWithStore } from '@opentrons/components/__utils__'
import { Card, LabeledValue, Link, SecondaryBtn } from '@opentrons/components'
import * as Shell from '../../../shell'
import { Portal } from '../../portal'
import { TitledControl } from '../../TitledControl'
import { AppSoftwareSettingsCard } from '../AppSoftwareSettingsCard'
import { UpdateAppModal } from '../UpdateAppModal'
import { UpdateNotificationsControl } from '../UpdateNotificationsControl'

import type { State } from '../../../types'

// TODO(mc, 2020-10-08): this is a partial mock because shell/update
// needs some reorg to split actions and selectors
jest.mock('../../../shell/update', () => ({
  ...jest.requireActual('../../../shell/update'),
  getAvailableShellUpdate: jest.fn(),
}))

jest.mock('../UpdateAppModal', () => ({ UpdateAppModal: () => null }))

const getAvailableShellUpdate: JestMockFn<[State], string | null> =
  Shell.getAvailableShellUpdate

const MOCK_STATE: $Shape<State> = {}

describe('AppSoftwareSettingsCard', () => {
  const render = () => {
    return mountWithStore(<AppSoftwareSettingsCard />, {
      initialState: MOCK_STATE,
    })
  }

  beforeEach(() => {
    getAvailableShellUpdate.mockImplementation(state => {
      expect(state).toBe(MOCK_STATE)
      return null
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should be a card with the correct title', () => {
    const { wrapper } = render()
    const card = wrapper.find(Card)

    expect(card.prop('title')).toBe('App Software Settings')
  })

  it('should have a labeled value with the current version', () => {
    const { wrapper } = render()
    const versionValue = wrapper.find(LabeledValue)

    expect(versionValue.prop('label')).toBe('Software Version')
    expect(versionValue.prop('value')).toBe(Shell.CURRENT_VERSION)
  })

  it('should dispatch a shell:checkUpdate action on mount', () => {
    const { store } = render()

    expect(store.dispatch).toHaveBeenCalledWith(Shell.checkShellUpdate())
  })

  it('should have a SecondaryBtn that is disabled if no update available', () => {
    getAvailableShellUpdate.mockReturnValue(null)

    const { wrapper } = render()
    const button = wrapper.find(SecondaryBtn)

    expect(button.prop('disabled')).toBe(true)
  })

  it('clicking the SecondaryBtn should render an <UpdateAppModal> in a portal', () => {
    getAvailableShellUpdate.mockReturnValue('1.2.3')

    const { wrapper } = render()
    const button = wrapper.find(SecondaryBtn)

    expect(button.prop('disabled')).toBe(false)
    expect(wrapper.exists(UpdateAppModal)).toBe(false)

    button.invoke('onClick')()

    expect(wrapper.find(Portal).exists(UpdateAppModal)).toBe(true)
  })

  it('should be able to close the <UpdateAppModal>', () => {
    getAvailableShellUpdate.mockReturnValue('1.2.3')

    const { wrapper } = render()

    wrapper.find(SecondaryBtn).invoke('onClick')()
    wrapper.find(UpdateAppModal).invoke('closeModal')()

    expect(wrapper.exists(UpdateAppModal)).toBe(false)
  })

  it('should render a <UpdateNotificationsControl>', () => {
    const { wrapper } = render()
    expect(wrapper.exists(UpdateNotificationsControl)).toBe(true)
  })

  it('should have a TitledControl for downloaded previous software versions', () => {
    const { wrapper } = render()
    const section = wrapper
      .find(TitledControl)
      .filterWhere(
        t => t.prop('title') === 'Restore Different Software Version'
      )

    const releasesLink = section
      .find(Link)
      .filterWhere(
        a =>
          a.prop('href') === 'https://github.com/Opentrons/opentrons/releases'
      )

    const articleLink = section
      .find(Link)
      .filterWhere(
        a =>
          a.prop('href') ===
          'https://support.opentrons.com/articles/2393514-uninstall-the-opentrons-app'
      )

    expect(section.text()).toMatch(/restore a different version/i)
    expect(articleLink.prop('external')).toBe(true)
    expect(releasesLink.prop('external')).toBe(true)
  })
})
