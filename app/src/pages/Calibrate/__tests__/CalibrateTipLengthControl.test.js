// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import wellPlate96Def from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import tiprack300Def from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

import { getHasCalibrationBlock } from '../../../config'
import { selectors as robotSelectors } from '../../../robot'
import { useDispatchApiRequests } from '../../../robot-api'
import { getUncalibratedTipracksByMount } from '../../../pipettes'
import * as Sessions from '../../../sessions'
import { CalibrateTipLengthControl } from '../CalibrateTipLengthControl'
import * as Analytics from '../../../analytics/actions'

import type { Labware } from '../../../robot/types'
import type { State } from '../../../types'

jest.mock('../../../robot-api')
jest.mock('../../../robot/selectors')
jest.mock('../../../sessions/selectors')
jest.mock('../../../config/selectors')
jest.mock('../../../pipettes/selectors')
jest.mock('../../../analytics/actions')

const mockGetUncalibratedTipracksByMount: JestMockFn<
  [State, string],
  $Call<typeof getUncalibratedTipracksByMount, State, string>
> = getUncalibratedTipracksByMount

const mockGetUnconfirmedLabware: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getUnconfirmedLabware, State>
> = robotSelectors.getUnconfirmedLabware

const mockUseDispatchApiRequests: JestMockFn<
  [() => void],
  [() => void, Array<string>]
> = useDispatchApiRequests

const mockGetHasCalibrationBlock: JestMockFn<
  [State],
  $Call<typeof getHasCalibrationBlock, State>
> = getHasCalibrationBlock

const threehundredtiprack: LabwareDefinition2 = tiprack300Def
const MOCK_STATE: State = ({ mockState: true }: any)

const stubUnconfirmedLabware = [
  ({
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
  }: $Shape<Labware>),
]

describe('Testing calibrate tip length control', () => {
  let dispatchApiRequests
  let render
  const fakeRobot = 'fakerobot'
  const fakeMount = 'right'

  beforeEach(() => {
    dispatchApiRequests = jest.fn()
    mockUseDispatchApiRequests.mockReturnValue([dispatchApiRequests, []])
    mockGetUncalibratedTipracksByMount.mockReturnValue({ left: [], right: [] })
    mockGetUnconfirmedLabware.mockReturnValue(stubUnconfirmedLabware)
    mockGetHasCalibrationBlock.mockReturnValue(true)
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

  it('check dispatch session and dispatch analytics are called with a tip length session', () => {
    const { wrapper, store } = render()
    const { dispatch } = store
    const beginButton = wrapper
      .find('UncalibratedInfo')
      .find('button')
      .at(0)
    beginButton.invoke('onClick')()
    wrapper.update()
    const continueButton = wrapper
      .find('ConfirmRecalibrationModal')
      .find('button')
      .at(0)
    continueButton.invoke('onClick')()
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
    const beginButton = wrapper
      .find('UncalibratedInfo')
      .find('button')
      .at(0)
    beginButton.invoke('onClick')()
    wrapper.update()
    const continueButton = wrapper
      .find('ConfirmRecalibrationModal')
      .find('button')
      .at(0)
    continueButton.invoke('onClick')()
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
