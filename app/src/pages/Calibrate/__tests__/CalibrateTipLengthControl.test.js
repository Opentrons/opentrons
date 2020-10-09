// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import tiprack300Def from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

import { useDispatchApiRequests } from '../../../robot-api'
import * as Sessions from '../../../sessions'
import { CalibrateTipLengthControl } from '../CalibrateTipLengthControl'

import type { State } from '../../../types'

jest.mock('../../../robot-api')
jest.mock('../../../sessions/selectors')
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}))

const mockUseDispatchApiRequests: JestMockFn<
  [() => void],
  [() => void, Array<string>]
> = useDispatchApiRequests

const threehundredtiprack: LabwareDefinition2 = tiprack300Def
const MOCK_STATE: State = ({ mockState: true }: any)

describe('Testing calibrate tip length control', () => {
  let dispatchApiRequests
  let render
  const fakeRobot = 'fakerobot'
  const fakeMount = 'right'

  beforeEach(() => {
    dispatchApiRequests = jest.fn()
    mockUseDispatchApiRequests.mockReturnValue([dispatchApiRequests, []])
    render = (
      props: $Shape<React.ElementProps<typeof CalibrateTipLengthControl>> = {}
    ) => {
      const {
        isExtendedPipOffset = false,
        hasCalibrated = true,
        tipRackDefinition = threehundredtiprack,
      } = props
      return mountWithStore(
        <CalibrateTipLengthControl
          robotName={fakeRobot}
          hasCalibrated={hasCalibrated}
          mount={fakeMount}
          tipRackDefinition={tipRackDefinition}
          isExtendedPipOffset={isExtendedPipOffset}
        />,
        {
          initialState: MOCK_STATE,
        }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('check dispatch is called with a tip length session', () => {
    const { wrapper } = render()
    const toClick = wrapper.find('UncalibratedInfo').find('button')
    toClick.invoke('onClick')()
    wrapper.update()
    expect(dispatchApiRequests).toHaveBeenCalledWith(
      Sessions.ensureSession(
        fakeRobot,
        Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
        {
          mount: fakeMount,
          hasCalibrationBlock: true,
          tipRackDefinition: threehundredtiprack,
        }
      )
    )
  })

  it('check dispatch is called with a pipette offset session', () => {
    const { wrapper } = render({ isExtendedPipOffset: true })
    const toClick = wrapper.find('UncalibratedInfo').find('button')
    toClick.invoke('onClick')()
    wrapper.update()
    expect(dispatchApiRequests).toHaveBeenCalledWith(
      Sessions.ensureSession(
        fakeRobot,
        Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
        {
          mount: fakeMount,
          hasCalibrationBlock: true,
          shouldPerformTipLength: true,
          tipRackDefinition: threehundredtiprack,
        }
      )
    )
  })
})
