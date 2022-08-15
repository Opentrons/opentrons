import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { useCalibratePipetteOffset } from '../../../../organisms/CalibratePipetteOffset/useCalibratePipetteOffset'
import { AskForCalibrationBlockModal } from '../../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { getHasCalibrationBlock } from '../../../../redux/config'
import { mockPipetteInfo } from '../../../../redux/pipettes/__fixtures__'
import { useDeckCalibrationData } from '../../hooks'
import { SetupPipetteCalibrationItem } from '../SetupPipetteCalibrationItem'

jest.mock(
  '../../../../organisms/CalibratePipetteOffset/useCalibratePipetteOffset'
)
jest.mock(
  '../../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'
)
jest.mock('../../../../redux/config')
jest.mock('../../hooks')

const mockGetHasCalibrationBlock = getHasCalibrationBlock as jest.MockedFunction<
  typeof getHasCalibrationBlock
>
const mockUseCalibratePipetteOffset = useCalibratePipetteOffset as jest.MockedFunction<
  typeof useCalibratePipetteOffset
>
const mockAskForCalibrationBlockModal = AskForCalibrationBlockModal as jest.MockedFunction<
  typeof AskForCalibrationBlockModal
>
const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'

describe('SetupPipetteCalibrationItem', () => {
  const render = ({
    pipetteInfo = mockPipetteInfo,
    index = 1,
    mount = 'left',
    robotName = ROBOT_NAME,
    runId = RUN_ID,
  }: Partial<
    React.ComponentProps<typeof SetupPipetteCalibrationItem>
  > = {}) => {
    return renderWithProviders(
      <SetupPipetteCalibrationItem
        {...{
          pipetteInfo,
          index,
          mount,
          robotName,
          runId,
        }}
      />,
      { i18nInstance: i18n }
    )[0]
  }

  let startWizard: any

  beforeEach(() => {
    startWizard = jest.fn()
    when(mockUseCalibratePipetteOffset).mockReturnValue([startWizard, null])
    when(mockGetHasCalibrationBlock).mockReturnValue(null)
    when(mockAskForCalibrationBlockModal).mockReturnValue(
      <div>Mock AskForCalibrationBlockModal</div>
    )
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

  it('renders the calibrate now button if pipette attached but not calibrated', () => {
    const { getByText, getByRole } = render({
      pipetteInfo: {
        ...mockPipetteInfo,
        tipRacksForPipette: [],
        requestedPipetteMatch: 'match',
        pipetteCalDate: null,
      },
    })

    getByText('Not calibrated yet')
    const calibrateNowButton = getByRole('button', { name: 'Calibrate Now' })
    calibrateNowButton.click()
    getByText('Mock AskForCalibrationBlockModal')
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
