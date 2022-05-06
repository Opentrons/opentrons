import * as React from 'react'
import {
  Tooltip,
  PrimaryBtn,
  SecondaryBtn,
  mountWithProviders,
  WrapperWithStore,
} from '@opentrons/components'

import { i18n } from '../../../../i18n'
import * as Sessions from '../../../../redux/sessions'
import { TitledControl } from '../../../../atoms/TitledControl'
import { CheckCalibrationControl } from '../CheckCalibrationControl'

import type { State, Action } from '../../../../redux/types'
import type { HTMLAttributes, ReactWrapper } from 'enzyme'

import { mockCalibrationCheckSessionAttributes } from '../../../../redux/sessions/__fixtures__'

jest.mock('../../../../redux/robot-api/selectors')
jest.mock('../../../../redux/sessions/selectors')
jest.mock('../../../../organisms/CheckCalibration', () => ({
  CheckCalibration: () => <></>,
}))

const getRobotSessionOfType = Sessions.getRobotSessionOfType as jest.MockedFunction<
  typeof Sessions.getRobotSessionOfType
>

const MOCK_STATE: State = { mockState: true } as any

describe('CheckCalibrationControl', () => {
  const getCalCheckButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof CheckCalibrationControl>>
  ): ReactWrapper<HTMLAttributes> =>
    wrapper
      .find('TitledControl[title="calibration health check"]')
      .find('button')

  const render = (
    props: Partial<React.ComponentProps<typeof CheckCalibrationControl>> = {}
  ): WrapperWithStore<
    React.ComponentProps<typeof CheckCalibrationControl>,
    State,
    Action
  > => {
    const { robotName = 'robot-name', disabledReason = null } = props
    return mountWithProviders<
      React.ComponentProps<typeof CheckCalibrationControl>,
      State,
      Action
    >(
      <CheckCalibrationControl
        robotName={robotName}
        disabledReason={disabledReason}
      />,
      { initialState: MOCK_STATE, i18n }
    )
  }

  beforeEach(() => {
    const mockCalibrationCheckSession: Sessions.CalibrationCheckSession = {
      id: 'fake_check_session_id',
      ...mockCalibrationCheckSessionAttributes,
    }
    getRobotSessionOfType.mockReturnValue(mockCalibrationCheckSession)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a TitledControl', () => {
    const { wrapper } = render({ disabledReason: null })
    const titledButton = wrapper.find(TitledControl)
    const button = titledButton.find(SecondaryBtn)

    expect(titledButton.prop('title')).toMatch(/calibration health check/)
    expect(titledButton.html()).toMatch(
      /check the health of the current calibration settings/i
    )
    expect(button.html()).toMatch(/check health/i)
  })

  it('should be able to disable the button', () => {
    const { wrapper } = render({ disabledReason: 'oh no!' })
    const button = wrapper.find('button')
    const tooltip = wrapper.find(Tooltip)

    expect(button.prop('disabled')).toBe(true)
    expect(tooltip.prop('children')).toBe('oh no!')
  })

  it('button launches new check calibration health after confirm', () => {
    const { wrapper, store } = render()
    getCalCheckButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()

    const calBlockButton = wrapper.find(PrimaryBtn)
    calBlockButton.invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()

    expect(store.dispatch).toHaveBeenCalledWith({
      ...Sessions.ensureSession(
        'robot-name',
        Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
        {
          hasCalibrationBlock: true,
          tipRacks: [],
        }
      ),
      meta: expect.objectContaining({ requestId: expect.any(String) }),
    })
  })
})
