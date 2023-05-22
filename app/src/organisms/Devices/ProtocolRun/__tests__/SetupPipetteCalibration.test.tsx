import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { mockTipRackDefinition } from '../../../../redux/custom-labware/__fixtures__'
import { useRunPipetteInfoByMount } from '../../hooks'
import { SetupPipetteCalibrationItem } from '../SetupPipetteCalibrationItem'
import { SetupInstrumentCalibration } from '../SetupInstrumentCalibration'
import type { PipetteInfo } from '../../hooks'

jest.mock('../../hooks')
jest.mock('../SetupPipetteCalibrationItem')

const mockUseRunPipetteInfoByMount = useRunPipetteInfoByMount as jest.MockedFunction<
  typeof useRunPipetteInfoByMount
>
const mockSetupPipetteCalibrationItem = SetupPipetteCalibrationItem as jest.MockedFunction<
  typeof SetupPipetteCalibrationItem
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
      lastModifiedDate: '',
      tipRackDef: mockTipRackDefinition,
    },
  ],
} as PipetteInfo

const render = () => {
  return renderWithProviders(
    <SetupInstrumentCalibration robotName={ROBOT_NAME} runId={RUN_ID} />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('SetupPipetteCalibration', () => {
  beforeEach(() => {
    when(mockUseRunPipetteInfoByMount).calledWith(RUN_ID).mockReturnValue({
      left: PIPETTE_INFO,
      right: null,
    })
    when(mockSetupPipetteCalibrationItem).mockReturnValue(
      <div>Mock SetupPipetteCalibrationItem</div>
    )
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders required pipettes title', () => {
    const { getByText } = render()
    getByText('Required Instrument Calibrations')
  })
  it('renders one SetupPipetteCalibrationItem when protocol run requires one pipette', () => {
    const { getAllByText } = render()
    expect(getAllByText('Mock SetupPipetteCalibrationItem')).toHaveLength(1)
  })
  it('renders two SetupPipetteCalibrationItems when protocol run requires two pipettes', () => {
    when(mockUseRunPipetteInfoByMount).calledWith(RUN_ID).mockReturnValue({
      left: PIPETTE_INFO,
      right: PIPETTE_INFO,
    })
    const { getAllByText } = render()
    expect(getAllByText('Mock SetupPipetteCalibrationItem')).toHaveLength(2)
  })
})
