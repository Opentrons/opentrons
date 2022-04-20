import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import { i18n } from '../../../../i18n'
import { getHasCalibrationBlock } from '../../../../redux/config'
import { AskForCalibrationBlockModal } from '../../../CalibrateTipLength'
import { useCalibratePipetteOffset } from '../../../CalibratePipetteOffset/useCalibratePipetteOffset'
import { usePipetteOffsetCalibration } from '../../hooks'
import { PipetteOverflowMenu } from '../PipetteOverflowMenu'
import { PipetteCard } from '..'
import {
  mockLeftSpecs,
  mockRightSpecs,
} from '../../../../redux/pipettes/__fixtures__'

jest.mock('../PipetteOverflowMenu')
jest.mock('../../../../redux/config')
jest.mock('../../../CalibratePipetteOffset/useCalibratePipetteOffset')
jest.mock('../../../CalibrateTipLength')
jest.mock('../../hooks')

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

const render = (props: React.ComponentProps<typeof PipetteCard>) => {
  return renderWithProviders(<PipetteCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mockRobotName'
describe('PipetteCard', () => {
  let startWizard: any

  beforeEach(() => {
    startWizard = jest.fn()
    when(mockPipetteOverflowMenu).mockReturnValue(
      <div>mock pipette overflow menu</div>
    )
    when(mockUsePipetteOffsetCalibration).mockReturnValue(null)
    when(mockGetHasCalibrationBlock).mockReturnValue(null)
    when(mockUseCalibratePipetteOffset).mockReturnValue([startWizard, null])
    when(mockAskForCalibrationBlockModal).mockReturnValue(
      <div>Mock AskForCalibrationBlockModal</div>
    )
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
    })
    getByText('left Mount')
    getByText('Left Pipette')
  })
  it('renders information for a right pipette', () => {
    const { getByText } = render({
      pipetteInfo: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteId: 'id',
    })
    getByText('right Mount')
    getByText('Right Pipette')
  })
  it('renders information for no pipette on right Mount', () => {
    const { getByText } = render({
      pipetteInfo: null,
      mount: RIGHT,
      robotName: mockRobotName,
    })
    getByText('right Mount')
    getByText('Empty')
  })
  it('renders information for no pipette on left Mount', () => {
    const { getByText } = render({
      pipetteInfo: null,
      mount: LEFT,
      robotName: mockRobotName,
    })
    getByText('left Mount')
    getByText('Empty')
  })
  it('renders kebab icon and is clickable', () => {
    const { getByRole, getByText } = render({
      pipetteInfo: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
    })

    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })

    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
    getByText('mock pipette overflow menu')
  })
})
