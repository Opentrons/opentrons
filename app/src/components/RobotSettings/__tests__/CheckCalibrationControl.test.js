// @flow
import * as React from 'react'

import * as Sessions from '../../../sessions'

import { Tooltip, PrimaryBtn, SecondaryBtn } from '@opentrons/components'
import { mountWithStore } from '@opentrons/components/__utils__'
import { TitledControl } from '../../TitledControl'
import { CheckCalibrationControl } from '../CheckCalibrationControl'

import type { State } from '../../../types'

import { mockCalibrationCheckSessionAttributes } from '../../../sessions/__fixtures__'

jest.mock('../../../robot-api/selectors')
jest.mock('../../../sessions/selectors')
jest.mock('../../CheckCalibration', () => ({
  CheckCalibration: () => <></>,
}))

const getRobotSessionOfType: JestMockFn<
  [State, string, Sessions.SessionType],
  $Call<
    typeof Sessions.getRobotSessionOfType,
    State,
    string,
    Sessions.SessionType
  >
> = Sessions.getRobotSessionOfType

const MOCK_STATE: State = ({ mockState: true }: any)

describe('CheckCalibrationControl', () => {
  const getCalCheckButton = wrapper =>
    wrapper
      .find('TitledControl[title="Calibration Health Check"]')
      .find('button')

  const render = (
    props: $Shape<React.ElementProps<typeof CheckCalibrationControl>> = {}
  ) => {
    const { robotName = 'robot-name', disabledReason = null } = props
    return mountWithStore(
      <CheckCalibrationControl
        robotName={robotName}
        disabledReason={disabledReason}
      />,
      { initialState: MOCK_STATE }
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

    expect(titledButton.prop('title')).toMatch(/Calibration Health Check/)
    expect(titledButton.html()).toMatch(
      /check the health of the current calibration settings/i
    )
    expect(button.prop('width')).toBe('12rem')
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
    getCalCheckButton(wrapper).invoke('onClick')()
    wrapper.update()

    const calBlockButton = wrapper.find(PrimaryBtn)
    calBlockButton.invoke('onClick')()
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
