import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { SPACING } from '@opentrons/components'
import {
  getModuleDisplayName,
  getLabwareDisplayName,
} from '@opentrons/shared-data'
import { parseLiquidsInLoadOrder } from '@opentrons/api-client'

import { StyledText } from '../../../atoms/text'
import {
  useProtocolDetailsForRun,
  useRunPipetteInfoByMount,
  useLabwareRenderInfoForRunById,
} from '../hooks'

import type { RunCommandSummary } from '@opentrons/api-client'
import type { Mount } from '@opentrons/components'
import type { RunTimeCommand } from '@opentrons/shared-data'
import type { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

interface RunLogProtocolSetupInfoProps {
  robotName: string
  runId: string
  setupCommand?: RunTimeCommand | RunCommandSummary
}

export const RunLogProtocolSetupInfo = ({
  robotName,
  runId,
  setupCommand,
}: RunLogProtocolSetupInfoProps): JSX.Element | null => {
  const { t } = useTranslation('run_details')
  const { protocolData } = useProtocolDetailsForRun(runId)
  const protocolPipetteData = useRunPipetteInfoByMount(robotName, runId)
  const labwareRenderInfoById = useLabwareRenderInfoForRunById(runId)

  if (protocolData == null) return null
  if (setupCommand === undefined) return null
  if (
    setupCommand.result?.definition?.metadata?.displayName?.includes(
      'Trash'
    ) === true
  ) {
    return null
  }

  let setupCommandText
  if (setupCommand.commandType === 'loadPipette') {
    const pipetteData = protocolPipetteData[setupCommand.params.mount as Mount]
    if (pipetteData == null) {
      return null
    }
    setupCommandText = (
      <Trans
        t={t}
        id="RunDetails_PipetteSetup"
        i18nKey="load_pipette_protocol_setup"
        values={{
          pipette_name: pipetteData.pipetteSpecs.displayName,
          mount_name: setupCommand.params.mount === 'left' ? 'Left' : 'Right',
        }}
      />
    )
  } else if (setupCommand.commandType === 'loadModule') {
    // TODO(bh, 2022-03-30): parse based on module model or type, not module id
    const moduleId = setupCommand.params.moduleId
    const moduleModel = protocolData.modules[moduleId]
    const moduleSlotNumber = moduleId.includes('thermocycler') ? 4 : 1
    setupCommandText = (
      <Trans
        t={t}
        id="RunDetails_ModuleSetup"
        i18nKey="load_modules_protocol_setup"
        count={moduleSlotNumber}
        values={{
          module: getModuleDisplayName(moduleModel.model),
          slot_name: Object.values(setupCommand.params.location)[0],
        }}
      />
    )
  } else if (setupCommand.commandType === 'loadLabware') {
    let moduleName: string | null = null
    let slotNumber = Object.values(setupCommand.params.location)[0]
    if ('moduleId' in setupCommand.params.location) {
      const moduleId = setupCommand.params.location.moduleId
      const moduleModel = protocolData.modules[moduleId]
      const moduleRunTimeCommand = protocolData.commands
        .filter(
          (command): command is LoadModuleRunTimeCommand =>
            command.commandType === 'loadModule'
        )
        .find(command => command.params.moduleId === moduleId)
      const moduleSlotNumber = moduleRunTimeCommand?.params.location.slotName
      slotNumber = moduleSlotNumber
      moduleName = getModuleDisplayName(moduleModel.model)
    }
    let moduleSlots = 0
    if (moduleName === null) {
      moduleSlots = 0
    } else if (moduleName?.includes('Thermocycler')) {
      moduleSlots = 4
    } else if (moduleName != null) {
      moduleSlots = 1
    }
    setupCommandText =
      moduleName === null ? (
        <Trans
          t={t}
          id="RunDetails_LabwareSetup_NoModules"
          i18nKey="load_labware_info_protocol_setup_no_module"
          values={{
            labware_loadname:
              setupCommand.result?.definition.metadata.displayName,
            labware_version: setupCommand.result?.definition.version,
            slot_number: slotNumber,
          }}
        />
      ) : (
        <Trans
          t={t}
          id="RunDetails_LabwareSetup_WithModules"
          i18nKey="load_labware_info_protocol_setup"
          count={moduleSlots}
          values={{
            labware_loadname:
              setupCommand.result?.definition.metadata.displayName,
            labware_version: setupCommand.result?.definition.version,
            slot_number: slotNumber,
            module_name: moduleName,
          }}
        />
      )
  } else if (setupCommand.commandType === 'loadLiquid') {
    const liquidInfo = parseLiquidsInLoadOrder()
    const { liquidId, labwareId } = setupCommand.params
    const liquidDisplayName = liquidInfo.find(
      liquid => liquid.liquidId === liquidId
    )?.displayName
    setupCommandText = (
      <Trans
        t={t}
        id={`RunDetails_LabwareSetup_WithLiquids`}
        i18nKey={'load_liquids_info_protocol_setup'}
        values={{
          liquid: liquidDisplayName ?? 'liquid',
          labware: getLabwareDisplayName(
            labwareRenderInfoById[labwareId].labwareDef
          ),
        }}
      />
    )
  }

  return (
    <StyledText
      as="p"
      padding={`${SPACING.spacing3} ${SPACING.spacing3} ${SPACING.spacing2} 0`}
    >
      {setupCommandText}
    </StyledText>
  )
}
