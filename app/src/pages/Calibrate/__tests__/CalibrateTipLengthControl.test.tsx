import * as React from 'react'
import { mountWithStore } from '@opentrons/components'

import wellPlate96Def from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import tiprack300Def from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

import { getHasCalibrationBlock } from '../../../redux/config'
import { selectors as robotSelectors } from '../../../redux/robot'
import { useDispatchApiRequests } from '../../../redux/robot-api'
import { getUncalibratedTipracksByMount } from '../../../redux/pipettes'
import * as Sessions from '../../../redux/sessions'
import { CalibrateTipLengthControl } from '../CalibrateTipLengthControl'
import * as Analytics from '../../../redux/analytics/actions'

import type { Labware } from '../../../redux/robot/types'
import type { State } from '../../../redux/types'
import type { DispatchApiRequestType } from '../../../redux/robot-api'
import type { WrapperWithStore } from '@opentrons/components'

jest.mock('../../../redux/robot-api')
jest.mock('../../../redux/robot/selectors')
jest.mock('../../../redux/sessions/selectors')
jest.mock('../../../redux/config/selectors')
jest.mock('../../../redux/pipettes/selectors')
jest.mock('../../../redux/analytics/actions')

const mockGetUncalibratedTipracksByMount = getUncalibratedTipracksByMount as jest.MockedFunction<
  typeof getUncalibratedTipracksByMount
>

const mockGetUnconfirmedLabware = robotSelectors.getUnconfirmedLabware as jest.MockedFunction<
  typeof robotSelectors.getUnconfirmedLabware
>

const mockUseDispatchApiRequests = useDispatchApiRequests as jest.MockedFunction<
  typeof useDispatchApiRequests
>

const mockGetHasCalibrationBlock = getHasCalibrationBlock as jest.MockedFunction<
  typeof getHasCalibrationBlock
>

const threehundredtiprack: LabwareDefinition2 = tiprack300Def as any
const MOCK_STATE: State = { mockState: true } as any

const stubUnconfirmedLabware: Labware[] = [
  {
    _id: 123,
    type: 'some_wellplate',
    slot: '4',
    position: null,
    name: 'some wellplate',
    calibratorMount: 'left',
    isTiprack: false,
    confirmed: false,
    isLegacy: false,
    definitionHash: 'some_hash',
    calibration: 'unconfirmed',
    isMoving: false,
    definition: wellPlate96Def,
  } as Labware,
]

describe('Testing calibrate tip length control', () => {
  let dispatchApiRequests: DispatchApiRequestType
  let render: (
    props?: Partial<React.ComponentProps<typeof CalibrateTipLengthControl>>
  ) => WrapperWithStore<React.ComponentProps<typeof CalibrateTipLengthControl>>
  const fakeRobot = 'fakerobot'
  const fakeMount = 'right'

  beforeEach(() => {
    dispatchApiRequests = jest.fn()
    mockUseDispatchApiRequests.mockReturnValue([dispatchApiRequests, []])
    mockGetUncalibratedTipracksByMount.mockReturnValue({ left: [], right: [] })
    mockGetUnconfirmedLabware.mockReturnValue(stubUnconfirmedLabware)
    mockGetHasCalibrationBlock.mockReturnValue(true)
    render = (props = {}) => {
      const {
        isExtendedPipOffset = false,
        hasCalibrated = true,
        tipRackDefinition = threehundredtiprack,
      } = props
      return mountWithStore<
        React.ComponentProps<typeof CalibrateTipLengthControl>
      >(
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

  it('check dispatch session and dispatch analytics are called with a tip length session', () => {
    const { wrapper, store } = render()
    const { dispatch } = store
    const beginButton = wrapper.find('UncalibratedInfo').find('button').at(0)
    beginButton.invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()
    const continueButton = wrapper
      .find('ConfirmRecalibrationModal')
      .find('button')
      .at(0)
    continueButton.invoke('onClick')?.({} as React.MouseEvent)
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
    expect(dispatch).toHaveBeenCalledWith(
      Analytics.tipLengthCalibrationStarted(
        'tip-length-in-protocol',
        'left',
        true,
        'fixture/fixture_tiprack_300_ul/1'
      )
    )
  })

  it('check dispatch session and dispatch analytics are called with a pipette offset session', () => {
    const { wrapper, store } = render({ isExtendedPipOffset: true })
    const { dispatch } = store
    const beginButton = wrapper.find('UncalibratedInfo').find('button').at(0)
    beginButton.invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()
    const continueButton = wrapper
      .find('ConfirmRecalibrationModal')
      .find('button')
      .at(0)
    continueButton.invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()
    expect(dispatchApiRequests).toHaveBeenCalledWith(
      Sessions.ensureSession(
        fakeRobot,
        Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
        {
          mount: fakeMount,
          hasCalibrationBlock: true,
          shouldRecalibrateTipLength: true,
          tipRackDefinition: threehundredtiprack,
        }
      )
    )
    expect(dispatch).toHaveBeenCalledWith(
      Analytics.pipetteOffsetCalibrationStarted(
        'tip-length-in-protocol',
        'left',
        true,
        true,
        'fixture/fixture_tiprack_300_ul/1'
      )
    )
  })
})
