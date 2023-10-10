import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import { useCurrentSubsystemUpdateQuery } from '@opentrons/react-api-client'
import { i18n } from '../../../../i18n'
import { getHasCalibrationBlock } from '../../../../redux/config'
import { useDispatchApiRequest } from '../../../../redux/robot-api'
import { getAttachedPipetteSettingsFieldsById } from '../../../../redux/pipettes'
import { AskForCalibrationBlockModal } from '../../../CalibrateTipLength'
import { useCalibratePipetteOffset } from '../../../CalibratePipetteOffset/useCalibratePipetteOffset'
import { useDeckCalibrationData, useIsFlex } from '../../hooks'
import { PipetteOverflowMenu } from '../PipetteOverflowMenu'
import { AboutPipetteSlideout } from '../AboutPipetteSlideout'
import { PipetteCard } from '..'

import {
  mockLeftSpecs,
  mockRightSpecs,
  mockPipetteSettingsFieldsMap,
} from '../../../../redux/pipettes/__fixtures__'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'

import type { State } from '../../../../redux/types'
import type { DispatchApiRequestType } from '../../../../redux/robot-api'

jest.mock('../PipetteOverflowMenu')
jest.mock('../../../../redux/config')
jest.mock('../../../CalibratePipetteOffset/useCalibratePipetteOffset')
jest.mock('../../../CalibrateTipLength')
jest.mock('../../hooks')
jest.mock('../AboutPipetteSlideout')
jest.mock('../../../../redux/robot-api')
jest.mock('@opentrons/react-api-client')
jest.mock('../../../../redux/pipettes')

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
const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>
const mockUseCurrentSubsystemUpdateQuery = useCurrentSubsystemUpdateQuery as jest.MockedFunction<
  typeof useCurrentSubsystemUpdateQuery
>
const mockGetAttachedPipetteSettingsFieldsById = getAttachedPipetteSettingsFieldsById as jest.MockedFunction<
  typeof getAttachedPipetteSettingsFieldsById
>

const render = (props: React.ComponentProps<typeof PipetteCard>) => {
  return renderWithProviders(<PipetteCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mockRobotName'
describe('PipetteCard', () => {
  let startWizard: any
  let dispatchApiRequest: DispatchApiRequestType
  let props: React.ComponentProps<typeof PipetteCard>

  beforeEach(() => {
    startWizard = jest.fn()
    dispatchApiRequest = jest.fn()
    props = {
      pipetteModelSpecs: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteId: 'id',
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      updatePipette: jest.fn(),
      isRunActive: false,
    }
    when(mockUseIsFlex).calledWith(mockRobotName).mockReturnValue(false)
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
    mockUseCurrentSubsystemUpdateQuery.mockReturnValue({
      data: undefined,
    } as any)
    when(mockGetAttachedPipetteSettingsFieldsById)
      .calledWith({} as State, mockRobotName, 'id')
      .mockReturnValue(mockPipetteSettingsFieldsMap)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders information for a left pipette', () => {
    props = {
      pipetteModelSpecs: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteId: 'id',
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      updatePipette: jest.fn(),
      isRunActive: false,
    }
    const { getByText } = render(props)
    getByText('left Mount')
    getByText('Left Pipette')
  })
  it('renders information for a 96 channel pipette with overflow menu button not disabled', () => {
    props = {
      pipetteModelSpecs: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteId: 'id',
      pipetteIs96Channel: true,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      updatePipette: jest.fn(),
      isRunActive: false,
    }
    const { getByText, getByRole } = render(props)
    getByText('Both Mounts')
    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })
    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
    getByText('mock pipette overflow menu')
  })
  it('renders information for a right pipette', () => {
    props = {
      pipetteModelSpecs: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteId: 'id',
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      updatePipette: jest.fn(),
      isRunActive: false,
    }
    const { getByText } = render(props)
    getByText('right Mount')
    getByText('Right Pipette')
  })
  it('renders information for no pipette on right Mount', () => {
    props = {
      pipetteModelSpecs: null,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      updatePipette: jest.fn(),
      isRunActive: false,
    }
    const { getByText } = render(props)
    getByText('right Mount')
    getByText('Empty')
  })
  it('renders information for no pipette on left Mount', () => {
    props = {
      pipetteModelSpecs: null,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      updatePipette: jest.fn(),
      isRunActive: false,
    }
    const { getByText } = render(props)
    getByText('left Mount')
    getByText('Empty')
  })
  it('does not render banner to calibrate for ot2 pipette if not calibrated', () => {
    when(mockUseIsFlex).calledWith(mockRobotName).mockReturnValue(false)
    props = {
      pipetteModelSpecs: mockLeftSpecs,
      mount: LEFT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      updatePipette: jest.fn(),
      isRunActive: false,
    }
    const { queryByText } = render(props)
    expect(queryByText('Calibrate now')).toBeNull()
  })
  it('renders banner to calibrate for ot3 pipette if not calibrated', () => {
    when(mockUseIsFlex).calledWith(mockRobotName).mockReturnValue(true)
    props = {
      pipetteModelSpecs: { ...mockLeftSpecs, name: 'p300_single_flex' },
      mount: LEFT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      updatePipette: jest.fn(),
      isRunActive: false,
    }
    const { getByText } = render(props)
    getByText('Calibrate now')
  })
  it('renders kebab icon, opens and closes overflow menu on click', () => {
    props = {
      pipetteModelSpecs: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: false,
      updatePipette: jest.fn(),
      isRunActive: false,
    }
    const { getByRole, getByText, queryByText } = render(props)

    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })

    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
    const overflowMenu = getByText('mock pipette overflow menu')
    overflowMenu.click()
    expect(queryByText('mock pipette overflow menu')).toBeNull()
  })
  it('renders firmware update needed state if pipette is bad', () => {
    props = {
      pipetteModelSpecs: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: true,
      updatePipette: jest.fn(),
      isRunActive: false,
    }
    const { getByText } = render(props)
    getByText('Right mount')
    getByText('Instrument attached')
    getByText('Firmware update available.')
    getByText('Update now').click()
    expect(props.updatePipette).toHaveBeenCalled()
  })
  it('renders firmware update in progress state if pipette is bad and update in progress', () => {
    when(mockUseCurrentSubsystemUpdateQuery).mockReturnValue({
      data: { data: { updateProgress: 50 } as any },
    } as any)
    props = {
      pipetteModelSpecs: mockRightSpecs,
      mount: RIGHT,
      robotName: mockRobotName,
      pipetteIs96Channel: false,
      isPipetteCalibrated: false,
      pipetteIsBad: true,
      updatePipette: jest.fn(),
      isRunActive: false,
    }
    const { getByText } = render(props)
    getByText('Right mount')
    getByText('Instrument attached')
    getByText('Firmware update in progress...')
  })
  it('does not render a pipette settings slideout card if the pipette has no settings', () => {
    when(mockGetAttachedPipetteSettingsFieldsById)
      .calledWith({} as State, mockRobotName, 'id')
      .mockReturnValue(null)
    const { queryByTestId } = render(props)
    expect(
      queryByTestId(
        `PipetteSettingsSlideout_${mockRobotName}_${props.pipetteId}`
      )
    ).not.toBeInTheDocument()
  })
})
