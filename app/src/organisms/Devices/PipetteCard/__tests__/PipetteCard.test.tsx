import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import { i18n } from '../../../../i18n'
import { getHasCalibrationBlock } from '../../../../redux/config'
import { useDispatchApiRequest } from '../../../../redux/robot-api'
import { AskForCalibrationBlockModal } from '../../../CalibrateTipLength'
import { useCalibratePipetteOffset } from '../../../CalibratePipetteOffset/useCalibratePipetteOffset'
import { useDeckCalibrationData, useIsOT3 } from '../../hooks'
import { PipetteOverflowMenu } from '../PipetteOverflowMenu'
import { AboutPipetteSlideout } from '../AboutPipetteSlideout'
import { PipetteCard } from '..'

import {
  mockLeftSpecs,
  mockRightSpecs,
} from '../../../../redux/pipettes/__fixtures__'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

jest.mock('../PipetteOverflowMenu')
jest.mock('../../../../redux/config')
jest.mock('../../../CalibratePipetteOffset/useCalibratePipetteOffset')
jest.mock('../../../CalibrateTipLength')
jest.mock('../../hooks')
jest.mock('../AboutPipetteSlideout')
jest.mock('../../../../redux/robot-api')

const mockPipetteOverflowMenu = PipetteOverflowMenu as jest.MockedFunction<
  typeof PipetteOverflowMenu
>
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
const mockAboutPipettesSlideout = AboutPipetteSlideout as jest.MockedFunction<
  typeof AboutPipetteSlideout
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockUseIsOT3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>

const render = (props: React.ComponentProps<typeof PipetteCard>) => {
  return renderWithProviders(<PipetteCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mockRobotName'
describe('PipetteCard', () => {
  let startWizard: any
  let dispatchApiRequest: DispatchApiRequestType

  beforeEach(() => {
    startWizard = jest.fn()
    dispatchApiRequest = jest.fn()
    when(mockUseIsOT3).calledWith(mockRobotName).mockReturnValue(false)
    when(mockAboutPipettesSlideout).mockReturnValue(
      <div>mock about slideout</div>
    )
    when(mockUseDeckCalibrationData).calledWith(mockRobotName).mockReturnValue({
      isDeckCalibrated: true,
      deckCalibrationData: mockDeckCalData,
    })
    when(mockPipetteOverflowMenu).mockReturnValue(
      <div>mock pipette overflow menu</div>
    )
    when(mockGetHasCalibrationBlock).mockReturnValue(null)
    when(mockUseCalibratePipetteOffset).mockReturnValue([startWizard, null])
    when(mockAskForCalibrationBlockModal).mockReturnValue(
      <div>Mock AskForCalibrationBlockModal</div>
    )
    when(mockUseDispatchApiRequest).mockReturnValue([
      dispatchApiRequest,
      ['id'],
    ])
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders information for a left pipette', () => {
    const { getByText } = render({
      pipetteInfo: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteId: 'id',
      is96ChannelAttached: false,
      isPipetteCalibrated: false,
    })
    getByText('left Mount')
    getByText('Left Pipette')
  })
  it('renders information for a 96 channel pipette with overflow menu button not disabled', () => {
    const { getByText, getByRole } = render({
      pipetteInfo: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteId: 'id',
      is96ChannelAttached: true,
      isPipetteCalibrated: false,
    })
    getByText('Both Mounts')
    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })
    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
    getByText('mock pipette overflow menu')
  })
  it('renders information for a right pipette', () => {
    const { getByText } = render({
      pipetteInfo: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteId: 'id',
      is96ChannelAttached: false,
      isPipetteCalibrated: false,
    })
    getByText('right Mount')
    getByText('Right Pipette')
  })
  it('renders information for no pipette on right Mount', () => {
    const { getByText } = render({
      pipetteInfo: null,
      mount: RIGHT,
      robotName: mockRobotName,
      is96ChannelAttached: false,
      isPipetteCalibrated: false,
    })
    getByText('right Mount')
    getByText('Empty')
  })
  it('renders information for no pipette on left Mount', () => {
    const { getByText } = render({
      pipetteInfo: null,
      mount: LEFT,
      robotName: mockRobotName,
      is96ChannelAttached: false,
      isPipetteCalibrated: false,
    })
    getByText('left Mount')
    getByText('Empty')
  })
  it('does not render banner to calibrate for ot2 pipette if not calibrated', () => {
    when(mockUseIsOT3).calledWith(mockRobotName).mockReturnValue(false)
    const { queryByText } = render({
      pipetteInfo: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      is96ChannelAttached: false,
      isPipetteCalibrated: false,
    })
    expect(queryByText('Calibrate now')).toBeNull()
  })
  it('renders banner to calibrate for ot3 pipette if not calibrated', () => {
    when(mockUseIsOT3).calledWith(mockRobotName).mockReturnValue(true)
    const { getByText } = render({
      pipetteInfo: { ...mockLeftSpecs, name: 'p300_single_flex' },
      mount: LEFT,
      robotName: mockRobotName,
      is96ChannelAttached: false,
      isPipetteCalibrated: false,
    })
    getByText('Calibrate now')
  })
  it('renders kebab icon, opens and closes overflow menu on click', () => {
    const { getByRole, getByText, queryByText } = render({
      pipetteInfo: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      is96ChannelAttached: false,
      isPipetteCalibrated: false,
    })

    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })

    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
    const overflowMenu = getByText('mock pipette overflow menu')
    overflowMenu.click()
    expect(queryByText('mock pipette overflow menu')).toBeNull()
  })
})
