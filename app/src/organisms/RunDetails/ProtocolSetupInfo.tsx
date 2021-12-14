import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Box,
  FONT_SIZE_BODY_1,
  SPACING_1,
  SPACING_2,
} from '@opentrons/components'
import { getModuleDisplayName, ProtocolFile } from '@opentrons/shared-data'
import { useCurrentRunPipetteInfoByMount } from '../ProtocolSetup/RunSetupCard/hooks'
import { useProtocolDetails } from './hooks'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'

interface ProtocolSetupInfoProps {
  setupCommand?: Command
}

export const ProtocolSetupInfo = (
  props: ProtocolSetupInfoProps
): JSX.Element | null => {
  const { setupCommand } = props
  const { t } = useTranslation('run_details')
  const protocolData: ProtocolFile<{}> | null = useProtocolDetails()
    .protocolData

  const protocolPipetteData = useCurrentRunPipetteInfoByMount()
  if (protocolData == null) return null
  if (setupCommand === undefined) return null
  if (
    setupCommand.result?.definition?.metadata.displayName.includes('Trash') ===
    true
  ) {
    return null
  }

  let SetupCommandText
  if (setupCommand.commandType === 'loadPipette') {
    const pipetteData = protocolPipetteData[setupCommand.params.mount]
    if (pipetteData == null) {
      return null
    }
    SetupCommandText = (
      <Trans
        t={t}
        id={`RunDetails_PipetteSetup`}
        i18nKey={'load_pipette_protocol_setup'}
        values={{
          pipette_name: pipetteData.pipetteSpecs.displayName,
          mount_name: setupCommand.params.mount === 'left' ? 'Left' : 'Right',
        }}
      />
    )
  } else if (setupCommand.commandType === 'loadModule') {
    const moduleId = setupCommand.params.moduleId
    const moduleModel = protocolData.modules[moduleId]
    const moduleSlotNumber = moduleId.includes('thermocycler') ? 4 : 1
    SetupCommandText = (
      <Trans
        t={t}
        id={`RunDetails_ModuleSetup`}
        i18nKey={'load_modules_protocol_setup'}
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
      const moduleSlotNumber = protocolData.commands.find(
        command =>
          command.commandType === 'loadModule' &&
          command.params.moduleId === moduleId
        //  @ts-expect-error narrow to load module command when command types get updated
      )?.params.location.slotName
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
    SetupCommandText =
      moduleName === null ? (
        <Trans
          t={t}
          id={`RunDetails_LabwareSetup_NoModules`}
          i18nKey={'load_labware_info_protocol_setup_no_module'}
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
          id={`RunDetails_LabwareSetup_WithModules`}
          i18nKey={'load_labware_info_protocol_setup'}
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
  }
  return (
    <Box
      padding={`${SPACING_1} ${SPACING_2} ${SPACING_1} 0`}
      fontSize={FONT_SIZE_BODY_1}
    >
      {SetupCommandText}
    </Box>
  )
}
