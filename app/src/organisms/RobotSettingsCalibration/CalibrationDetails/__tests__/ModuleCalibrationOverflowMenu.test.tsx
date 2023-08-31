import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { ModuleWizardFlows } from '../../../ModuleWizardFlows'
import { mockMagneticModule } from '../../../../redux/modules/__fixtures__'
import { ModuleCalibrationOverflowMenu } from '../ModuleCalibrationOverflowMenu'

jest.mock('../../../ModuleWizardFlows')

const mockModuleWizardFlows = ModuleWizardFlows as jest.MockedFunction<
  typeof ModuleWizardFlows
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
})
