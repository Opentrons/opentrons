import { mockPipetteInfo } from '/app/redux/pipettes/__fixtures__'
import { CHOOSE_DROP_TIP_LOCATION, DT_ROUTES } from '../constants'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { DropTipWizardContainerProps } from '../types'

const MOCK_ACTUAL_PIPETTE = {
  ...mockPipetteInfo.pipetteSpecs,
  model: 'model',
  tipLength: {
    value: 20,
  },
} as PipetteModelSpecs

const MOCK_FN = () => null as any

export const mockDropTipWizardContainerProps: DropTipWizardContainerProps = {
  issuedCommandsType: 'setup',
  activeMaintenanceRunId: 'MOCK_MAINTENANCE_RUN_ID',
  errorDetails: null,
  currentStep: CHOOSE_DROP_TIP_LOCATION,
  currentRoute: DT_ROUTES.DROP_TIP,
  currentStepIdx: 0,
  robotType: 'OT-3 Standard',
  isExiting: false,
  mount: 'left',
  modalStyle: 'simple',
  isOnDevice: true,
  fixitCommandTypeUtils: undefined,
  instrumentModelSpecs: MOCK_ACTUAL_PIPETTE,
  isExitInitiated: false,
  isFinalWizardStep: false,
  isCommandInProgress: false,
  showConfirmExit: false,
  dropTipCommands: {} as any,
  errorComponents: {} as any,
  goBack: MOCK_FN,
  cancelExit: MOCK_FN,
  closeFlow: MOCK_FN,
  confirmExit: MOCK_FN,
  goBackRunValid: MOCK_FN,
  proceedToRouteAndStep: MOCK_FN,
  toggleExitInitiated: MOCK_FN,
  proceedWithConditionalClose: MOCK_FN,
  proceed: MOCK_FN,
  dropTipCommandLocations: [],
}
