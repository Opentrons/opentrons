import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { mockPipetteInfo } from '../../../../redux/pipettes/__fixtures__'
import {
  useDeckCalibrationData,
  useAttachedPipettesFromInstrumentsQuery,
  useIsOT3,
} from '../../hooks'
import { PipetteWizardFlows } from '../../../PipetteWizardFlows'
import { SetupPipetteCalibrationItem } from '../SetupPipetteCalibrationItem'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/dom'

jest.mock('../../hooks')
jest.mock('../../../PipetteWizardFlows')

const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>
const mockUseIsOT3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>
const mockUseAttachedPipettesFromInstrumentsQuery = useAttachedPipettesFromInstrumentsQuery as jest.MockedFunction<
  typeof useAttachedPipettesFromInstrumentsQuery
>
const mockPipetteWizardFlows = PipetteWizardFlows as jest.MockedFunction<
  typeof PipetteWizardFlows
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
    mockPipetteWizardFlows.mockReturnValue(<div>pipette wizard flows</div>)
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
        name: 'Calibrate Now',
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
  it('renders an attach button if on a Flex and pipette is not attached', () => {
    mockUseIsOT3.mockReturnValue(true)
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: null,
      right: null,
    })
    const { getByText, getByRole } = render({
      pipetteInfo: {
        ...mockPipetteInfo,
        tipRacksForPipette: [],
        requestedPipetteMatch: 'incompatible',
        pipetteCalDate: null,
      },
    })
    getByText('Left Mount')
    getByText(mockPipetteInfo.pipetteSpecs.displayName)
    const attach = getByRole('button', { name: 'Attach Pipette' })
    fireEvent.click(attach)
    getByText('pipette wizard flows')
  })
  it('renders a calibrate button if on a Flex and pipette is not calibrated', () => {
    mockUseIsOT3.mockReturnValue(true)
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: {
        data: {
          calibratedOffset: {
            last_modified: undefined,
          },
        },
      } as any,
      right: null,
    })
    const { getByText, getByRole } = render({
      pipetteInfo: {
        ...mockPipetteInfo,
        tipRacksForPipette: [],
        requestedPipetteMatch: 'match',
        pipetteCalDate: null,
      },
    })
    getByText('Left Mount')
    getByText(mockPipetteInfo.pipetteSpecs.displayName)
    const attach = getByRole('button', { name: 'Calibrate Now' })
    fireEvent.click(attach)
    getByText('pipette wizard flows')
  })
  it('renders calibrated text if on a Flex and pipette is calibrated', () => {
    mockUseIsOT3.mockReturnValue(true)
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: {
        data: {
          calibratedOffset: {
            last_modified: 'today',
          },
        },
      } as any,
      right: null,
    })
    const { getByText } = render({
      pipetteInfo: {
        ...mockPipetteInfo,
        tipRacksForPipette: [],
        requestedPipetteMatch: 'match',
        pipetteCalDate: null,
      },
    })
    getByText('Left Mount')
    getByText(mockPipetteInfo.pipetteSpecs.displayName)
    getByText('Last calibrated: today')
  })
})
