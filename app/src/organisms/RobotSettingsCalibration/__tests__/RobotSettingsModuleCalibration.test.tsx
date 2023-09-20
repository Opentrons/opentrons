import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ModuleCalibrationItems } from '../CalibrationDetails/ModuleCalibrationItems'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../redux/modules/__fixtures__'
import { RobotSettingsModuleCalibration } from '../RobotSettingsModuleCalibration'

jest.mock('../CalibrationDetails/ModuleCalibrationItems')

const mockModuleCalibrationItems = ModuleCalibrationItems as jest.MockedFunction<
  typeof ModuleCalibrationItems
>

const render = (
  props: React.ComponentProps<typeof RobotSettingsModuleCalibration>
) => {
  return renderWithProviders(<RobotSettingsModuleCalibration {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RobotSettingsModuleCalibration', () => {
  let props: React.ComponentProps<typeof RobotSettingsModuleCalibration>

  beforeEach(() => {
    props = {
      attachedModules: mockFetchModulesSuccessActionPayloadModules,
      updateRobotStatus: jest.fn(),
      formattedPipetteOffsetCalibrations: [],
    }
    mockModuleCalibrationItems.mockReturnValue(
      <div>mock ModuleCalibrationItems</div>
    )
  })

  it('should render text and ModuleCalibrationItems when a module is attached', () => {
    const [{ getByText }] = render(props)
    getByText('Module Calibration')
    getByText(
      "Module calibration uses a pipette and attached probe to determine the module's exact position relative to the deck."
    )
    getByText('mock ModuleCalibrationItems')
  })

  it('should render no modules attached when there is no module', () => {
    props = { ...props, attachedModules: [] }
    const [{ getByText }] = render(props)
    getByText('Module Calibration')
    getByText(
      "Module calibration uses a pipette and attached probe to determine the module's exact position relative to the deck."
    )
    getByText('No modules attached')
  })
})
