import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { useFeatureFlag } from '../../../../redux/config'
import { mockTipRackDefinition } from '../../../../redux/custom-labware/__fixtures__'
import { useRunPipetteInfoByMount } from '../../hooks'
import { SetupTipLengthCalibrationButton } from '../SetupTipLengthCalibrationButton'
import { DeprecatedSetupTipLengthCalibrationButton } from '../DeprecatedSetupTipLengthCalibrationButton'
import { SetupTipLengthCalibration } from '../SetupTipLengthCalibration'

import type { PipetteInfo } from '../../hooks'

jest.mock('../../../../redux/config')
jest.mock('../../hooks')
jest.mock('../SetupTipLengthCalibrationButton')
jest.mock('../DeprecatedSetupTipLengthCalibrationButton')

const mockUseRunPipetteInfoByMount = useRunPipetteInfoByMount as jest.MockedFunction<
  typeof useRunPipetteInfoByMount
>
const mockSetupTipLengthCalibrationButton = SetupTipLengthCalibrationButton as jest.MockedFunction<
  typeof SetupTipLengthCalibrationButton
>
const mockDeprecatedSetupTipLengthCalibrationButton = DeprecatedSetupTipLengthCalibrationButton as jest.MockedFunction<
  typeof DeprecatedSetupTipLengthCalibrationButton
>
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
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
    when(mockUseRunPipetteInfoByMount)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        left: PIPETTE_INFO,
        right: null,
      })
    when(mockSetupTipLengthCalibrationButton).mockReturnValue(
      <div>Mock SetupTipLengthCalibrationButton</div>
    )
    when(mockDeprecatedSetupTipLengthCalibrationButton).mockReturnValue(
      <div>Mock DeprecatedSetupTipLengthCalibrationButton</div>
    )
    when(mockUseFeatureFlag)
      .calledWith('enableCalibrationWizards')
      .mockReturnValue(false)
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
    expect(
      getAllByText('Mock DeprecatedSetupTipLengthCalibrationButton')
    ).toHaveLength(1)
    expect(
      getAllByText('Attach pipette to see tip length calibration information')
    ).toHaveLength(1)
    expect(queryByText('Last calibrated:')).toBeFalsy()
  })
  it('renders two tip length calibrations when protocol run requires two pipettes', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        left: PIPETTE_INFO,
        right: PIPETTE_INFO,
      })
    const { getAllByText, queryByText } = render()

    expect(getAllByText('pipette 1')).toHaveLength(2)
    expect(getAllByText('Mock TipRack Definition')).toHaveLength(2)
    expect(
      getAllByText('Mock DeprecatedSetupTipLengthCalibrationButton')
    ).toHaveLength(2)
    expect(
      getAllByText('Attach pipette to see tip length calibration information')
    ).toHaveLength(2)
    expect(queryByText('Last calibrated:')).toBeFalsy()
  })
  it('renders new tip length button when enableCalibrationWizards feature flag is set', () => {
    when(mockUseFeatureFlag)
      .calledWith('enableCalibrationWizards')
      .mockReturnValue(true)
    const { getByText, queryByText } = render()

    expect(
      getByText('Mock SetupTipLengthCalibrationButton')
    ).toBeInTheDocument()
    expect(
      queryByText('Mock DeprecatedSetupTipLengthCalibrationButton')
    ).toBeNull()
  })
  it('renders last calibrated date when available', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith(ROBOT_NAME, RUN_ID)
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
      .calledWith(ROBOT_NAME, RUN_ID)
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
