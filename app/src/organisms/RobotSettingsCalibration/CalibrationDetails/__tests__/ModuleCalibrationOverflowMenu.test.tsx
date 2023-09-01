import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { ModuleWizardFlows } from '../../../ModuleWizardFlows'
import { mockMagneticModule } from '../../../../redux/modules/__fixtures__'
import {
  useRunStatuses,
  useAttachedPipettes,
  useAttachedPipetteCalibrations,
} from '../../../Devices/hooks'
import { mockLeftProtoPipette } from '../../../../redux/pipettes/__fixtures__'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
} from '../../../../redux/calibration/pipette-offset/__fixtures__'
import { ModuleCalibrationOverflowMenu } from '../ModuleCalibrationOverflowMenu'

import type { PipetteCalibrationsByMount } from '../../../../redux/pipettes/types'

jest.mock('../../../ModuleWizardFlows')
jest.mock('../../../Devices/hooks')

const mockAttachedPipetteCalibrations: PipetteCalibrationsByMount = {
  left: {
    offset: mockPipetteOffsetCalibration1,
  },
  right: {
    offset: mockPipetteOffsetCalibration2,
  },
} as any

const mockModuleWizardFlows = ModuleWizardFlows as jest.MockedFunction<
  typeof ModuleWizardFlows
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockUseAttachedPipetteCalibrations = useAttachedPipetteCalibrations as jest.MockedFunction<
  typeof useAttachedPipetteCalibrations
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
    }
    mockModuleWizardFlows.mockReturnValue(<div>module wizard flows</div>)
    mockUseAttachedPipettes.mockReturnValue({
      left: mockLeftProtoPipette,
      right: null,
    })
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunIdle: false,
      isRunTerminal: false,
    })
    mockUseAttachedPipetteCalibrations.mockReturnValue(
      mockAttachedPipetteCalibrations
    )
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
    mockUseAttachedPipettes.mockReturnValue({
      left: null,
      right: null,
    })
    const [{ getByLabelText }] = render(props)
    expect(getByLabelText('ModuleCalibrationOverflowMenu')).toBeDisabled()
  })

  it('should be disabled when not calibrated module and pipette is not calibrated', () => {
    mockUseAttachedPipetteCalibrations.mockReturnValue({
      left: null,
      right: null,
    } as any)
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
