import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Btn,
  C_MED_DARK_GRAY,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
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
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'

interface ProtocolSetupInfoProps {
  onCloseClick: () => unknown
  SetupCommand: Command
}

export const ProtocolSetupInfo = (
  props: ProtocolSetupInfoProps
): JSX.Element | null => {
  const { SetupCommand } = props
  const { t } = useTranslation('run_details')

  let SetupCommandText
  if (SetupCommand.commandType === 'loadPipette') {
    SetupCommandText = (
      <Trans
        t={t}
        id={`RunDetails_PipetteSetup`}
        i18nKey={'load_pipette_protocol_setup'}
        values={{
          pipette_name: SetupCommand.result?.pipetteId,
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
    const moduleSlotNumber = SetupCommand.result?.moduleId.includes(
      'thermocycler'
    )
      ? 4
      : 1
    SetupCommandText = (
      <Trans
        t={t}
        id={`RunDetails_ModuleSetup`}
        i18nKey={'load_modules_protocol_setup'}
        count={moduleSlotNumber}
        values={{
          module: SetupCommand.result?.moduleId,
          slot_name: Object.values(SetupCommand.params.location)[0],
        }}
      />
    )
  } else if (SetupCommand.commandType === 'loadLabware') {
    const moduleUnderLabware = Object.values(SetupCommand.params.location)[1]
    let moduleIncluded = 0
    if (moduleUnderLabware == null) {
      moduleIncluded = 0
    } else if (
      moduleUnderLabware !== null &&
      //  @ts-ignore: moduleUnderLabware is possibly 'null'
      moduleUnderLabware.includes('thermocycler')
    ) {
      moduleIncluded = 4
    } else if (moduleUnderLabware != null) {
      moduleIncluded = 1
    }
    SetupCommand.result?.definition.metadata.displayName.includes('trash')
      ? (SetupCommandText = null)
      : (SetupCommandText = (
          <Trans
            t={t}
            id={`RunDetails_LabwareSetup`}
            i18nKey={
              moduleIncluded === 0
                ? 'load_labware_info_protocol_setup_no_module'
                : 'load_labware_info_protocol_setup'
            }
            count={moduleIncluded === 0 ? undefined : moduleIncluded}
            values={{
              labware_loadname:
                SetupCommand.result?.definition.metadata.displayName,
              labware_version: SetupCommand.result?.definition.version,
              slot_number: Object.values(SetupCommand.params.location)[0],
              module_name: Object.values(SetupCommand.params.location)[1],
            }}
          />
        ))
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      margin={SPACING_1}
      width={'100%'}
      fontSize={FONT_SIZE_BODY_1}
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
      <Flex flexDirection={DIRECTION_ROW}>{SetupCommandText}</Flex>
    </Flex>
  )
}
