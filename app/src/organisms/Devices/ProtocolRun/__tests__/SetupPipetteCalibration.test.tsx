import { when } from 'vitest-when'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockTipRackDefinition } from '/app/redux/custom-labware/__fixtures__'
import { SetupPipetteCalibrationItem } from '../SetupPipetteCalibrationItem'
import { SetupInstrumentCalibration } from '../SetupInstrumentCalibration'
import {
  useNotifyRunQuery,
  useRunPipetteInfoByMount,
} from '/app/resources/runs'

import type { PipetteInfo } from '/app/redux/pipettes'

vi.mock('../SetupPipetteCalibrationItem')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/resources/runs')

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
    when(vi.mocked(useRunPipetteInfoByMount)).calledWith(RUN_ID).thenReturn({
      left: PIPETTE_INFO,
      right: null,
    })
    vi.mocked(SetupPipetteCalibrationItem).mockReturnValue(
      <div>Mock SetupPipetteCalibrationItem</div>
    )
    vi.mocked(useNotifyRunQuery).mockReturnValue({} as any)
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders required pipettes title', () => {
    render()
    screen.getByText('Required Instrument Calibrations')
  })
  it('renders one SetupPipetteCalibrationItem when protocol run requires one pipette', () => {
    render()
    expect(
      screen.getAllByText('Mock SetupPipetteCalibrationItem')
    ).toHaveLength(1)
  })
  it('renders two SetupPipetteCalibrationItems when protocol run requires two pipettes', () => {
    when(vi.mocked(useRunPipetteInfoByMount)).calledWith(RUN_ID).thenReturn({
      left: PIPETTE_INFO,
      right: PIPETTE_INFO,
    })
    render()
    expect(
      screen.getAllByText('Mock SetupPipetteCalibrationItem')
    ).toHaveLength(2)
  })
})
