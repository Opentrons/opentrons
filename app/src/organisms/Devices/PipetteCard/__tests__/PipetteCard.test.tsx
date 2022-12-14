import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { isOT3Pipette, LEFT, RIGHT } from '@opentrons/shared-data'
import { i18n } from '../../../../i18n'
import { getHasCalibrationBlock } from '../../../../redux/config'
import { Banner } from '../../../../atoms/Banner'
import { useDispatchApiRequest } from '../../../../redux/robot-api'
import { AskForCalibrationBlockModal } from '../../../CalibrateTipLength'
import { useCalibratePipetteOffset } from '../../../CalibratePipetteOffset/useCalibratePipetteOffset'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibration,
} from '../../hooks'
import { PipetteOverflowMenu } from '../PipetteOverflowMenu'
import { AboutPipetteSlideout } from '../AboutPipetteSlideout'
import { PipetteCard } from '..'

import {
  mockLeftSpecs,
  mockRightSpecs,
} from '../../../../redux/pipettes/__fixtures__'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'

import type { DeckCalibrationInfo } from '../../../../redux/calibration/api-types'
import type { DispatchApiRequestType } from '../../../../redux/robot-api'

jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    isOT3Pipette: jest.fn(),
  }
})

jest.mock('../PipetteOverflowMenu')
jest.mock('../../../../redux/config')
jest.mock('../../../CalibratePipetteOffset/useCalibratePipetteOffset')
jest.mock('../../../CalibrateTipLength')
jest.mock('../../hooks')
jest.mock('../../../../atoms/Banner')
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
const mockUsePipetteOffsetCalibration = usePipetteOffsetCalibration as jest.MockedFunction<
  typeof usePipetteOffsetCalibration
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
const mockBanner = Banner as jest.MockedFunction<typeof Banner>
const mockIsOT3Pipette = isOT3Pipette as jest.MockedFunction<
  typeof isOT3Pipette
>

const render = (props: React.ComponentProps<typeof PipetteCard>) => {
  return renderWithProviders(<PipetteCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockBadDeckCal: DeckCalibrationInfo = {
  type: 'affine',
  matrix: [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
  ],
  lastModified: 'September 15, 2021',
  pipetteCalibratedWith: null,
  tiprack: null,
  source: 'user',
  status: {
    markedBad: true,
    source: 'unknown',
    markedAt: '',
  },
}
const mockRobotName = 'mockRobotName'
describe('PipetteCard', () => {
  let startWizard: any
  let dispatchApiRequest: DispatchApiRequestType

  beforeEach(() => {
    startWizard = jest.fn()
    dispatchApiRequest = jest.fn()
    when(mockAboutPipettesSlideout).mockReturnValue(
      <div>mock about slideout</div>
    )
    when(mockBanner).mockReturnValue(<div>mock banner</div>)
    when(mockUseDeckCalibrationData).calledWith(mockRobotName).mockReturnValue({
      isDeckCalibrated: true,
      deckCalibrationData: mockDeckCalData,
    })
    when(mockPipetteOverflowMenu).mockReturnValue(
      <div>mock pipette overflow menu</div>
    )
    when(mockUsePipetteOffsetCalibration).mockReturnValue(null)
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
    })
    getByText('right Mount')
    getByText('Right Pipette')
  })
  it('renders information for a right pipette with no deck cal banner', () => {
    when(mockUseDeckCalibrationData).calledWith(mockRobotName).mockReturnValue({
      isDeckCalibrated: false,
      deckCalibrationData: null,
    })
    const { getByText } = render({
      pipetteInfo: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteId: 'id',
      is96ChannelAttached: false,
    })
    getByText('right Mount')
    getByText('Right Pipette')
    getByText('mock banner')
  })
  it('renders information for a right pipette with no pipette offset cal banner', () => {
    const { getByText } = render({
      pipetteInfo: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteId: 'id',
      is96ChannelAttached: false,
    })
    getByText('right Mount')
    getByText('Right Pipette')
    getByText('mock banner')
  })
  it('renders information for a right pipette with bad deck cal banner', () => {
    when(mockUseDeckCalibrationData).calledWith(mockRobotName).mockReturnValue({
      isDeckCalibrated: true,
      deckCalibrationData: mockBadDeckCal,
    })
    const { getByText } = render({
      pipetteInfo: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteId: 'id',
      is96ChannelAttached: false,
    })
    getByText('right Mount')
    getByText('Right Pipette')
    getByText('mock banner')
  })
  it('renders information for no pipette on right Mount', () => {
    const { getByText } = render({
      pipetteInfo: null,
      mount: RIGHT,
      robotName: mockRobotName,
      is96ChannelAttached: false,
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
    })
    getByText('left Mount')
    getByText('Empty')
  })
  it('renders kebab icon, opens and closes overflow menu on click', () => {
    const { getByRole, getByText, queryByText } = render({
      pipetteInfo: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      is96ChannelAttached: false,
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
  it('does not render the pipette offset calibration banner for GEN3 pipettes', () => {
    mockIsOT3Pipette.mockReturnValue(true)
    const { queryByText } = render({
      pipetteInfo: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteId: 'id',
      is96ChannelAttached: false,
    })
    expect(queryByText('mock banner')).toBeNull()
  })
})
