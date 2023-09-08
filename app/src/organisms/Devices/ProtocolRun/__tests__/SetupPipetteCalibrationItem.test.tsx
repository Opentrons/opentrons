import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { mockPipetteInfo } from '../../../../redux/pipettes/__fixtures__'
import { useDeckCalibrationData } from '../../hooks'
import { SetupPipetteCalibrationItem } from '../SetupPipetteCalibrationItem'
import { MemoryRouter } from 'react-router-dom'

jest.mock('../../hooks')

const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>
const ROBOT_NAME = 'otie'
const RUN_ID = '1'

describe('SetupPipetteCalibrationItem', () => {
  const render = ({
    pipetteInfo = mockPipetteInfo,
    mount = 'left',
    robotName = ROBOT_NAME,
    runId = RUN_ID,
  }: Partial<
    React.ComponentProps<typeof SetupPipetteCalibrationItem>
  > = {}) => {
    return renderWithProviders(
      <MemoryRouter>
        <SetupPipetteCalibrationItem
          {...{
            pipetteInfo,
            mount,
            robotName,
            runId,
          }}
        />
      </MemoryRouter>,
      { i18nInstance: i18n }
    )[0]
  }

  beforeEach(() => {
    when(mockUseDeckCalibrationData).calledWith(ROBOT_NAME).mockReturnValue({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
    })
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders the mount and pipette name', () => {
    const { getByText } = render()
    getByText('Left Mount')
    getByText(mockPipetteInfo.pipetteSpecs.displayName)
  })

  it('renders a link to the calibration dashboard if pipette attached but not calibrated', () => {
    const { getByText, getByRole } = render({
      pipetteInfo: {
        ...mockPipetteInfo,
        tipRacksForPipette: [],
        requestedPipetteMatch: 'match',
        pipetteCalDate: null,
      },
    })

    getByText('Not calibrated yet')
    expect(
      getByRole('link', {
        name: 'Calibrate now',
      }).getAttribute('href')
    ).toBe('/devices/otie/robot-settings/calibration/dashboard')
  })
  it('renders the pipette mismatch info if pipette calibrated but an inexact match', () => {
    const { getByText, getByRole } = render({
      pipetteInfo: {
        ...mockPipetteInfo,
        tipRacksForPipette: [],
        requestedPipetteMatch: 'inexact_match',
        pipetteCalDate: 'september 3, 2020',
      },
    })
    getByRole('link', { name: 'Learn more' })
    getByText('Pipette generation mismatch.')
  })
})
