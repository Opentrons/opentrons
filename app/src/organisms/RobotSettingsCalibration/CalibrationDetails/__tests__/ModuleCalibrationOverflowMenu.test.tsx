import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { ModuleWizardFlows } from '../../../ModuleWizardFlows'
import { mockMagneticModule } from '../../../../redux/modules/__fixtures__'
import {
  useRunStatuses,
} from '../../../Devices/hooks'
import { ModuleCalibrationOverflowMenu } from '../ModuleCalibrationOverflowMenu'

import type { Mount } from '@opentrons/components'
import type { PipetteCalibrationsByMount } from '../../../../redux/pipettes/types'

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

const mockModuleWizardFlows = ModuleWizardFlows as jest.MockedFunction<
  typeof ModuleWizardFlows
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>

const render = (
  props: React.ComponentProps<typeof ModuleCalibrationOverflowMenu>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<ModuleCalibrationOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ModuleCalibrationOverflowMenu', () => {
  let props: React.ComponentProps<typeof ModuleCalibrationOverflowMenu>

  beforeEach(() => {
    props = {
      isCalibrated: false,
      attachedModule: mockMagneticModule,
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
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render overflow menu buttons - not calibrated', () => {
    const [{ getByText, queryByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Calibrate module')
    expect(queryByText('Clear calibration data')).not.toBeInTheDocument()
  })

  it('should render overflow menu buttons - calibrated', () => {
    props = { ...props, isCalibrated: true }
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Recalibrate module')
    getByText('Clear calibration data')
  })

  it('should call a mock function when clicking calibrate button', () => {
    const [{ getByText, getByLabelText }] = render(props)
    getByLabelText('ModuleCalibrationOverflowMenu').click()
    getByText('Calibrate module').click()
    getByText('module wizard flows')
  })

  it('should be disabled when not calibrated module and pipette is not attached', () => {
    props.formattedPipetteOffsetCalibrations = [] as any
    const [{ getByLabelText }] = render(props)
    expect(getByLabelText('ModuleCalibrationOverflowMenu')).toBeDisabled()
  })

  it('should be disabled when not calibrated module and pipette is not calibrated', () => {
    props.formattedPipetteOffsetCalibrations[0].lastCalibrated = undefined
    props.formattedPipetteOffsetCalibrations[1].lastCalibrated = undefined
    const [{ getByLabelText }] = render(props)
    expect(getByLabelText('ModuleCalibrationOverflowMenu')).toBeDisabled()
  })

  it('should be disabled when running', () => {
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: true,
      isRunStill: false,
      isRunIdle: false,
      isRunTerminal: false,
    })
    const [{ getByLabelText }] = render(props)
    expect(getByLabelText('ModuleCalibrationOverflowMenu')).toBeDisabled()
  })
})
