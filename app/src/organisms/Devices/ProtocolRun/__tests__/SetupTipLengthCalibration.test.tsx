import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { mockTipRackDefinition } from '../../../../redux/custom-labware/__fixtures__'
import { useRunPipetteInfoByMount } from '../../hooks'
import { SetupTipLengthCalibrationButton } from '../SetupTipLengthCalibrationButton'
import { SetupTipLengthCalibration } from '../SetupTipLengthCalibration'

import type { PipetteInfo } from '../../hooks'

jest.mock('../../../../redux/config')
jest.mock('../../hooks')
jest.mock('../SetupTipLengthCalibrationButton')

const mockUseRunPipetteInfoByMount = useRunPipetteInfoByMount as jest.MockedFunction<
  typeof useRunPipetteInfoByMount
>
const mockSetupTipLengthCalibrationButton = SetupTipLengthCalibrationButton as jest.MockedFunction<
  typeof SetupTipLengthCalibrationButton
>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'

const PIPETTE_INFO = {
  requestedPipetteMatch: 'incompatible',
  pipetteCalDate: null,
  pipetteSpecs: {
    displayName: 'pipette 1',
  },
  tipRacksForPipette: [
    {
      displayName: 'Mock TipRack Definition',
      lastModifiedDate: null,
      tipRackDef: mockTipRackDefinition,
    },
  ],
} as PipetteInfo

const render = () => {
  return renderWithProviders(
    <SetupTipLengthCalibration robotName={ROBOT_NAME} runId={RUN_ID} />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('SetupTipLengthCalibration', () => {
  beforeEach(() => {
    when(mockUseRunPipetteInfoByMount).calledWith(RUN_ID).mockReturnValue({
      left: PIPETTE_INFO,
      right: null,
    })
    when(mockSetupTipLengthCalibrationButton).mockReturnValue(
      <div>Mock SetupTipLengthCalibrationButton</div>
    )
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders required tip length calibrations title', () => {
    const { getByText } = render()
    getByText('Required Tip Length Calibrations')
  })
  it('renders the pipette and tip rack name', () => {
    const { getAllByText, queryByText } = render()

    expect(getAllByText('pipette 1')).toHaveLength(1)
    expect(getAllByText('Mock TipRack Definition')).toHaveLength(1)
    expect(getAllByText('Mock SetupTipLengthCalibrationButton')).toHaveLength(1)
    expect(
      getAllByText('Attach pipette to see tip length calibration information')
    ).toHaveLength(1)
    expect(queryByText('Last calibrated:')).toBeFalsy()
  })
  it('renders two tip length calibrations when protocol run requires two pipettes', () => {
    when(mockUseRunPipetteInfoByMount).calledWith(RUN_ID).mockReturnValue({
      left: PIPETTE_INFO,
      right: PIPETTE_INFO,
    })
    const { getAllByText, queryByText } = render()

    expect(getAllByText('pipette 1')).toHaveLength(2)
    expect(getAllByText('Mock TipRack Definition')).toHaveLength(2)
    expect(getAllByText('Mock SetupTipLengthCalibrationButton')).toHaveLength(2)
    expect(
      getAllByText('Attach pipette to see tip length calibration information')
    ).toHaveLength(2)
    expect(queryByText('Last calibrated:')).toBeFalsy()
  })
  it('renders last calibrated date when available', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith(RUN_ID)
      .mockReturnValue({
        left: {
          ...PIPETTE_INFO,
          requestedPipetteMatch: 'match',
          tipRacksForPipette: [
            {
              displayName: 'Mock TipRack Definition',
              lastModifiedDate: 'yesterday',
              tipRackDef: mockTipRackDefinition,
            },
          ],
        },
        right: null,
      })

    const { getAllByText } = render()
    expect(getAllByText('Last calibrated: yesterday')).toHaveLength(1)
  })
  it('renders not calibrated yet when not calibrated', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith(RUN_ID)
      .mockReturnValue({
        left: {
          ...PIPETTE_INFO,
          requestedPipetteMatch: 'match',
        },
        right: null,
      })
    const { getAllByText } = render()
    expect(getAllByText('Not calibrated yet')).toHaveLength(1)
  })
})
