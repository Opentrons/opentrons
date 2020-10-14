// @flow
// TODO(mc, 2020-10-08): this file needs a lot more tests
// https://github.com/Opentrons/opentrons/issues/5174
import * as React from 'react'

import { mountWithStore } from '@opentrons/components/__utils__'
import { AlertModal } from '@opentrons/components'
import { mockReachableRobot } from '../../../../discovery/__fixtures__'
import { UPGRADE, DOWNGRADE, REINSTALL } from '../../../../buildroot'
import * as Shell from '../../../../shell'
import { Portal } from '../../../portal'
import { UpdateAppModal } from '../../../app-settings'
import { VersionInfoModal } from '../VersionInfoModal'

import type { State } from '../../../../types'

jest.mock('../../../../shell/update')
jest.mock('../../../app-settings', () => ({ UpdateAppModal: () => null }))

const MOCK_STATE: $Shape<State> = {}

const getAvailableShellUpdate: JestMockFn<[State], string | null> =
  Shell.getAvailableShellUpdate

describe('VersionInfoModal', () => {
  const handleClose = jest.fn()
  const handleProceed = jest.fn()

  const render = (robotUpdateType = UPGRADE) => {
    return mountWithStore(
      <VersionInfoModal
        robot={mockReachableRobot}
        robotUpdateType={robotUpdateType}
        close={handleClose}
        proceed={handleProceed}
      />,
      { initialState: MOCK_STATE }
    )
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

  it('should render an AlertModal with the proper title for an upgrade', () => {
    const { wrapper } = render(UPGRADE)
    const alert = wrapper.find(AlertModal)

    expect(alert.prop('heading')).toBe('Robot Update Available')
  })

  it('should render an AlertModal with the proper title for a downgrade', () => {
    const { wrapper } = render(DOWNGRADE)
    const alert = wrapper.find(AlertModal)

    expect(alert.prop('heading')).toBe('Robot Update Available')
  })

  it('should render an AlertModal with the proper title for a reinstall', () => {
    const { wrapper } = render(REINSTALL)
    const alert = wrapper.find(AlertModal)

    expect(alert.prop('heading')).toBe('Robot is up to date')
  })

  describe('with an app update available', () => {
    beforeEach(() => {
      getAvailableShellUpdate.mockReturnValue('1.2.3')
    })

    it('should render an AlertModal saying an app update is available', () => {
      const { wrapper } = render()
      const alert = wrapper.find(AlertModal)

      expect(alert.prop('heading')).toBe('App Version 1.2.3 Available')
    })

    it('should have a "View Update" button that opens an UpdateAppModal', () => {
      const { wrapper } = render()
      const alert = wrapper.find(AlertModal)
      const viewUpdateButton = alert
        .find('button')
        .filterWhere(b => /view app update/i.test(b.text()))

      expect(wrapper.exists(UpdateAppModal)).toBe(false)

      viewUpdateButton.invoke('onClick')()

      expect(wrapper.find(Portal).exists(UpdateAppModal)).toBe(true)
    })

    it('should call props.close when the UpdateAppModal is closed', () => {
      const { wrapper } = render()
      const alert = wrapper.find(AlertModal)
      const viewUpdateButton = alert
        .find('button')
        .filterWhere(b => /view app update/i.test(b.text()))

      viewUpdateButton.invoke('onClick')()

      expect(handleClose).not.toHaveBeenCalled()

      wrapper.find(UpdateAppModal).invoke('closeModal')()

      expect(handleClose).toHaveBeenCalled()
    })
  })
})
