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
import type { SetupCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

interface ProtocolSetupInfoProps {
  onCloseClick: () => unknown
  //SetupCommand: SetupCommand
}

export const ProtocolSetupInfo = (
  props: ProtocolSetupInfoProps
): JSX.Element | null => {
  const { SetupCommand } = props
  const SetupCommand = {
    commandType: 'loadModule',
    params: {
      moduleId: 'temperature_module_gen2',
      location: { slotName: '9', coordinates: { x: 0, y: 0, z: 0 } },
    },
    result: { moduleId: 'thermocycler_gen1' },
  }
  const { t } = useTranslation('run_details')

  let SetupCommandText
  // if (SetupCommand.commandType === 'loadPipette') {
  //   SetupCommandText = (
  //     <Trans
  //       t={t}
  //       id={`RunDetails_PipetteSetup`}
  //       i18nKey={'load_pipette_protocol_setup'}
  //       values={{
  //         pipette_name: SetupCommand.result?.pipetteId,
  //         mount_name: SetupCommand.params.mount,
  //       }}
  //       components={{
  //         span: (
  //           <Text
  //             textTransform={TEXT_TRANSFORM_CAPITALIZE}
  //             marginLeft={SPACING_1}
  //             marginRight={SPACING_1}
  //           />
  //         ),
  //       }}
  //     />
  //   )
  // } 
 if (SetupCommand.commandType === 'loadModule') {
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
  } 
  // else if (SetupCommand.commandType === 'loadLabware') {
  //   SetupCommand.result?.definition.metadata.displayName.includes('trash')
  //     ? (SetupCommandText = null)
  //     : (SetupCommandText = (
  //         <Trans
  //           t={t}
  //           id={`RunDetails_LabwareSetup`}
  //           i18nKey={'load_labware_info_protocol_setup'}
  //           values={{
  //             labware_loadname:
  //               SetupCommand.result?.definition.metadata.displayName,
  //             labware_version: SetupCommand.result?.definition.version,
  //             slot_number: Object.values(SetupCommand.params.location)[0],
  //           }}
  //         />
  //       ))
  // }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      margin={SPACING_1}
      width={'100%'}
      color={C_MED_DARK_GRAY}
      fontSize={FONT_SIZE_BODY_1}
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
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
