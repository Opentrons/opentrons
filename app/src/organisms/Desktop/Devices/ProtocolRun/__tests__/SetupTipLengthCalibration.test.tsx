import { when } from 'vitest-when'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockTipRackDefinition } from '/app/redux/custom-labware/__fixtures__'
import { useRunPipetteInfoByMount } from '/app/resources/runs'
import { SetupTipLengthCalibrationButton } from '../SetupTipLengthCalibrationButton'
import { SetupTipLengthCalibration } from '../SetupTipLengthCalibration'

import type { PipetteInfo } from '/app/redux/pipettes'

vi.mock('/app/redux/config')
vi.mock('/app/resources/runs')
vi.mock('../SetupTipLengthCalibrationButton')

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
    when(vi.mocked(useRunPipetteInfoByMount)).calledWith(RUN_ID).thenReturn({
      left: PIPETTE_INFO,
      right: null,
    })
    vi.mocked(SetupTipLengthCalibrationButton).mockReturnValue(
      <div>Mock SetupTipLengthCalibrationButton</div>
    )
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders required tip length calibrations title', () => {
    render()
    screen.getByText('Required Tip Length Calibrations')
  })
  it('renders the pipette and tip rack name', () => {
    render()

    expect(screen.getAllByText('pipette 1')).toHaveLength(1)
    expect(screen.getAllByText('Mock TipRack Definition')).toHaveLength(1)
    expect(
      screen.getAllByText('Mock SetupTipLengthCalibrationButton')
    ).toHaveLength(1)
    expect(
      screen.getAllByText(
        'Attach pipette to see tip length calibration information'
      )
    ).toHaveLength(1)
    expect(screen.queryByText('Last calibrated:')).toBeFalsy()
  })
  it('renders two tip length calibrations when protocol run requires two pipettes', () => {
    when(vi.mocked(useRunPipetteInfoByMount)).calledWith(RUN_ID).thenReturn({
      left: PIPETTE_INFO,
      right: PIPETTE_INFO,
    })
    render()

    expect(screen.getAllByText('pipette 1')).toHaveLength(2)
    expect(screen.getAllByText('Mock TipRack Definition')).toHaveLength(2)
    expect(
      screen.getAllByText('Mock SetupTipLengthCalibrationButton')
    ).toHaveLength(2)
    expect(
      screen.getAllByText(
        'Attach pipette to see tip length calibration information'
      )
    ).toHaveLength(2)
    expect(screen.queryByText('Last calibrated:')).toBeFalsy()
  })
  it('renders last calibrated date when available', () => {
    when(vi.mocked(useRunPipetteInfoByMount))
      .calledWith(RUN_ID)
      .thenReturn({
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

    render()
    expect(screen.getAllByText('Last calibrated: yesterday')).toHaveLength(1)
  })
  it('renders not calibrated yet when not calibrated', () => {
    when(vi.mocked(useRunPipetteInfoByMount))
      .calledWith(RUN_ID)
      .thenReturn({
        left: {
          ...PIPETTE_INFO,
          requestedPipetteMatch: 'match',
        },
        right: null,
      })
    render()
    expect(screen.getAllByText('Not calibrated yet')).toHaveLength(1)
  })
})
