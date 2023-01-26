import isEmpty from 'lodash/isEmpty'
import some from 'lodash/some'
import { useTranslation } from 'react-i18next'
import { getLoadedLabwareDefinitionsByUri } from '@opentrons/shared-data'
import {
  useProtocolDetailsForRun,
  useRunCalibrationStatus,
  useRunHasStarted,
  useStoredProtocolAnalysis,
  useUnmatchedModulesForProtocol,
} from '.'

export function useLPCDisabledReason(
  robotName: string,
  runId: string
): string | null {
  const { t } = useTranslation('protocol_setup')
  const runHasStarted = useRunHasStarted(runId)
  const { complete: isCalibrationComplete } = useRunCalibrationStatus(
    robotName,
    runId
  )
  const unmatchedModuleResults = useUnmatchedModulesForProtocol(
    robotName,
    runId
  )
  const { protocolData: robotProtocolAnalysis } = useProtocolDetailsForRun(
    runId
  )
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const { missingModuleIds } = unmatchedModuleResults
  const calibrationIncomplete =
    missingModuleIds.length === 0 && !isCalibrationComplete
  const moduleSetupIncomplete =
    missingModuleIds.length > 0 && isCalibrationComplete
  const moduleAndCalibrationIncomplete =
    missingModuleIds.length > 0 && !isCalibrationComplete
  const labwareDefinitions =
    protocolData?.commands != null
      ? getLoadedLabwareDefinitionsByUri(protocolData.commands)
      : {}

  const tipRackLoadedInProtocol: boolean = some(
    labwareDefinitions,
    def => def.parameters?.isTiprack
  )
  const tipsArePickedUp: boolean = some(
    protocolData?.commands,
    command => command.commandType === 'pickUpTip'
  )
  let lpcDisabledReason: string | null = null

  if (moduleAndCalibrationIncomplete) {
    lpcDisabledReason = t('lpc_disabled_modules_and_calibration_not_complete')
  } else if (calibrationIncomplete) {
    lpcDisabledReason = t('lpc_disabled_calibration_not_complete')
  } else if (moduleSetupIncomplete) {
    lpcDisabledReason = t('lpc_disabled_modules_not_connected')
  } else if (runHasStarted) {
    lpcDisabledReason = t('labware_position_check_not_available')
  } else if (robotProtocolAnalysis == null) {
    lpcDisabledReason = t(
      'labware_position_check_not_available_analyzing_on_robot'
    )
  } else if (
    isEmpty(protocolData?.pipettes) ||
    isEmpty(protocolData?.labware)
  ) {
    lpcDisabledReason = t('labware_position_check_not_available_empty_protocol')
  } else if (!tipRackLoadedInProtocol) {
    lpcDisabledReason = t('lpc_disabled_no_tipracks_loaded')
  } else if (!tipsArePickedUp) {
    lpcDisabledReason = t('lpc_disabled_no_tipracks_used')
  }

  return lpcDisabledReason
}
