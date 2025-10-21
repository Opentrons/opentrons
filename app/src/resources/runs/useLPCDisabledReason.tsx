import { useTranslation } from 'react-i18next'
import isEmpty from 'lodash/isEmpty'
import some from 'lodash/some'

import {
  FLEX_ROBOT_TYPE,
  getLoadedLabwareDefinitionsByUri,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { useIsFlex } from '/app/redux-resources/robots'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import {
  getIsFixtureMismatch,
  useDeckConfigurationCompatibility,
} from '/app/resources/deck_configuration'

import { useMostRecentCompletedAnalysis } from './useMostRecentCompletedAnalysis'
import { useRunCalibrationStatus } from './useRunCalibrationStatus'
import { useRunHasStarted } from './useRunHasStarted'
import { useUnmatchedModulesForProtocol } from './useUnmatchedModulesForProtocol'

interface LPCDisabledReasonProps {
  runId: string
  robotName?: string
  hasMissingModulesForFlex?: boolean
  hasMissingCalForFlex?: boolean
}
export function useLPCDisabledReason(
  props: LPCDisabledReasonProps
): string | null {
  const { runId, robotName, hasMissingModulesForFlex, hasMissingCalForFlex } =
    props
  const { t } = useTranslation(['protocol_setup', 'shared'])
  const runHasStarted = useRunHasStarted(runId)
  const { complete } = useRunCalibrationStatus(robotName ?? '', runId)
  const unmatchedModuleResults = useUnmatchedModulesForProtocol(
    robotName ?? '',
    runId
  )

  const isCalibrationComplete =
    robotName != null ? complete : !hasMissingCalForFlex
  const { missingModuleIds } = unmatchedModuleResults
  const isFlex = useIsFlex(robotName ?? '')
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE,
    robotProtocolAnalysis
  )
  const isFixtureMismatch = getIsFixtureMismatch(deckConfigCompatibility)
  const hasMissingModules =
    hasMissingModulesForFlex ?? missingModuleIds.length > 0
  const calibrationIncomplete = !hasMissingModules && !isCalibrationComplete
  const moduleSetupIncomplete =
    (hasMissingModules || isFixtureMismatch) && isCalibrationComplete
  const moduleAndCalibrationIncomplete =
    hasMissingModules && !isCalibrationComplete
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
    lpcDisabledReason = t(
      robotName != null
        ? 'lpc_disabled_modules_and_calibration_not_complete'
        : 'connect_all_hardware'
    )
  } else if (calibrationIncomplete) {
    lpcDisabledReason = t(
      robotName != null
        ? 'lpc_disabled_calibration_not_complete'
        : 'cal_all_pip'
    )
  } else if (moduleSetupIncomplete) {
    lpcDisabledReason = t(
      robotName != null
        ? 'lpc_disabled_modules_not_connected'
        : 'connect_all_mod'
    )
  } else if (runHasStarted) {
    lpcDisabledReason = t(
      robotName != null
        ? 'labware_position_check_not_available'
        : 'shared:robot_is_busy'
    )
  } else if (robotProtocolAnalysis == null) {
    lpcDisabledReason = t(
      robotName != null
        ? 'labware_position_check_not_available_analyzing_on_robot'
        : 'shared:robot_is_analyzing'
    )
  } else if (
    isEmpty(protocolData?.pipettes) ||
    isEmpty(protocolData?.labware)
  ) {
    lpcDisabledReason = t(
      robotName != null
        ? 'labware_position_check_not_available_empty_protocol'
        : 'must_have_labware_and_pip'
    )
  } else if (!tipRackLoadedInProtocol && !isFlex) {
    lpcDisabledReason = t(
      robotName != null
        ? 'lpc_disabled_no_tipracks_loaded'
        : 'no_tiprack_loaded'
    )
  } else if (!tipsArePickedUp && !isFlex) {
    lpcDisabledReason = t(
      robotName != null ? 'lpc_disabled_no_tipracks_used' : 'no_tiprack_used'
    )
  }

  return lpcDisabledReason
}
