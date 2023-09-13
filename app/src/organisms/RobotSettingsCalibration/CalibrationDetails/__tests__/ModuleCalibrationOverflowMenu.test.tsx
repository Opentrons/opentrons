import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import { ModuleWizardFlows } from '../../../ModuleWizardFlows'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import { useRunStatuses } from '../../../Devices/hooks'
import { useLatchControls } from '../../../ModuleCard/hooks'
import { ModuleCalibrationOverflowMenu } from '../ModuleCalibrationOverflowMenu'

import type { Mount } from '@opentrons/components'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ModuleCard/hooks')
jest.mock('../../../ModuleWizardFlows')
jest.mock('../../../Devices/hooks')

const mockPipetteOffsetCalibrations = [
  {
    modelName: 'mockPipetteModelLeft',
    serialNumber: '1234567',
    mount: 'left' as Mount,
    tiprack: 'mockTiprackLeft',
    lastCalibrated: '2022-11-10T18:14:01',
    markedBad: false,
  },
  {
    modelName: 'mockPipetteModelRight',
    serialNumber: '01234567',
    mount: 'right' as Mount,
    tiprack: 'mockTiprackRight',
    lastCalibrated: '2022-11-10T18:15:02',
    markedBad: false,
  },
]

const mockCreateLiveCommand = jest.fn()
const mockToggleLatch = jest.fn()

const mockModuleWizardFlows = ModuleWizardFlows as jest.MockedFunction<
  typeof ModuleWizardFlows
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>
const mockUseCreateLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseLatchControls = useLatchControls as jest.MockedFunction<
  typeof useLatchControls
>

const render = (
  props: React.ComponentProps<typeof ModuleCalibrationOverflowMenu>
) => {
  return renderWithProviders(<ModuleCalibrationOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ModuleCalibrationOverflowMenu', () => {
  let props: React.ComponentProps<typeof ModuleCalibrationOverflowMenu>

  beforeEach(() => {
    props = {
      isCalibrated: false,
      attachedModule: mockHeaterShaker,
      updateRobotStatus: jest.fn(),
      formattedPipetteOffsetCalibrations: mockPipetteOffsetCalibrations,
    }
    mockModuleWizardFlows.mockReturnValue(<div>module wizard flows</div>)
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunIdle: false,
      isRunTerminal: false,
    })
    mockUseCreateLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
    when(mockUseLatchControls)
      .calledWith(mockHeaterShaker)
      .mockReturnValue({
        toggleLatch: mockToggleLatch,
        isLatchClosed: true,
      } as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
    resetAllWhenMocks()
  })

  it('should render overflow menu buttons - not calibrated', () => {
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Calibrate module')
  })

  it('should render overflow menu buttons - calibrated', () => {
    props = { ...props, isCalibrated: true }
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Recalibrate module')
  })

  it('should call a mock function when clicking calibrate button', () => {
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Calibrate module').click()
    getByText('module wizard flows')
  })

  it('should be disabled when not calibrated module and pipette is not attached', () => {
    props.formattedPipetteOffsetCalibrations = [] as any
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    expect(getByText('Calibrate module')).toBeDisabled()
  })

  it('should be disabled when not calibrated module and pipette is not calibrated', () => {
    props.formattedPipetteOffsetCalibrations[0].lastCalibrated = undefined
    props.formattedPipetteOffsetCalibrations[1].lastCalibrated = undefined
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    expect(getByText('Calibrate module')).toBeDisabled()
  })

  it('should be disabled when running', () => {
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: true,
      isRunStill: false,
      isRunIdle: false,
      isRunTerminal: false,
    })
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    expect(getByText('Calibrate module')).toBeDisabled()
  })
})
