import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Btn,
  C_MED_DARK_GRAY,
  DIRECTION_COLUMN,
  Flex,
  FONT_SIZE_BODY_1,
  FONT_SIZE_CAPTION,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  SPACING_1,
  Text,
  TEXT_TRANSFORM_CAPITALIZE,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { getModuleDisplayName, ProtocolFile } from '@opentrons/shared-data'
import { getProtocolPipetteTipRackCalInfo } from '../../redux/pipettes'
import { getConnectedRobot } from '../../redux/discovery'
import { State } from '../../redux/types'
import { useSelector } from 'react-redux'
import { useProtocolDetails } from './hooks'
import { CommandItem, Status } from './CommandItem'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'

interface ProtocolSetupInfoProps {
  onCloseClick: () => unknown
  SetupCommand?: Command
  runStatus: string
  type: Status
}

export const ProtocolSetupInfo = (
  props: ProtocolSetupInfoProps
): JSX.Element | null => {
  const { SetupCommand, runStatus, type } = props
  const { t } = useTranslation('run_details')
  const protocolData: ProtocolFile<{}> | null = useProtocolDetails()
    .protocolData
  const robot = useSelector((state: State) => getConnectedRobot(state))
  const robotName = robot?.name != null ? robot?.name : ''
  const protocolPipetteData = useSelector((state: State) =>
    getProtocolPipetteTipRackCalInfo(state, robotName)
  )
  if (protocolData == null) return null
  if (SetupCommand === undefined) return null

  let SetupCommandText
  if (SetupCommand.commandType === 'loadPipette') {
    const pipetteData = protocolPipetteData[SetupCommand.params.mount]
    if (pipetteData == null) {
      return null
    }
    SetupCommandText = (
      <Trans
        t={t}
        id={`RunDetails_PipetteSetup`}
        i18nKey={'load_pipette_protocol_setup'}
        values={{
          pipette_name: pipetteData.pipetteDisplayName,
          mount_name: SetupCommand.params.mount,
        }}
        components={{
          span: (
            <Text
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
              marginLeft={SPACING_1}
              marginRight={SPACING_1}
            />
          ),
        }}
      />
    )
  } else if (SetupCommand.commandType === 'loadModule') {
    const moduleId = SetupCommand.params.moduleId
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
          slot_name: Object.values(SetupCommand.params.location)[0],
        }}
      />
    )
  } else if (SetupCommand.commandType === 'loadLabware') {
    let moduleName: string | null = null
    let slotNumber = Object.values(SetupCommand.params.location)[0]
    if ('moduleId' in SetupCommand.params.location) {
      const moduleId = SetupCommand.params.location.moduleId
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
    } else if (moduleName != null && moduleName.includes('Thermocycler')) {
      moduleSlots = 4
    } else if (moduleName != null) {
      moduleSlots = 1
    }

    SetupCommand.result?.definition.metadata.displayName.includes('Trash')
      ? (SetupCommandText = undefined)
      : (SetupCommandText =
          moduleName === null ? (
            <Trans
              t={t}
              id={`RunDetails_LabwareSetup_NoModules`}
              i18nKey={'load_labware_info_protocol_setup_no_module'}
              values={{
                labware_loadname:
                  SetupCommand.result?.definition.metadata.displayName,
                labware_version: SetupCommand.result?.definition.version,
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
                  SetupCommand.result?.definition.metadata.displayName,
                labware_version: SetupCommand.result?.definition.version,
                slot_number: slotNumber,
                module_name: moduleName,
              }}
            />
          ))
  }
  return (
    <Flex
      margin={SPACING_1}
      fontSize={FONT_SIZE_BODY_1}
      flexDirection={DIRECTION_COLUMN}
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} color={C_MED_DARK_GRAY}>
        <Text
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          fontSize={FONT_SIZE_CAPTION}
          id={`RunDetails_ProtocolSetupTitle`}
        >
          {t('protocol_setup')}
        </Text>
        <Btn size={SIZE_1} onClick={props.onCloseClick}>
          <Icon name="chevron-up" color={C_MED_DARK_GRAY}></Icon>
        </Btn>
      </Flex>
      <CommandItem
        currentCommand={SetupCommand}
        type={type}
        runStatus={runStatus}
        commandText={SetupCommandText}
      />
    </Flex>
  )
}
