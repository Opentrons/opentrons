import * as React from 'react'
import {
  Btn,
  C_MED_DARK_GRAY,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  FONT_BODY_1_LIGHT,
  FONT_SIZE_BODY_1,
  FONT_SIZE_BODY_2,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_LIGHT,
  FONT_WEIGHT_REGULAR,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Mount,
  SIZE_1,
  SIZE_2,
  SPACING_1,
  SPACING_3,
  Text,
  TEXT_TRANSFORM_CAPITALIZE,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useProtocolDetails } from './hooks'

interface ProtocolSetupInfoProps {
  onCloseClick: () => unknown
}

export const ProtocolSetupInfo = (
  props: ProtocolSetupInfoProps
): JSX.Element | null => {
  const { t } = useTranslation('run_details')
  const { protocolData } = useProtocolDetails()
  if (protocolData === null) return null
  const pipetteInfo = Object.values(protocolData.pipettes)
  const moduleInfo = Object.values(protocolData.modules)
  const labwareInfo = Object.values(protocolData.labwareDefinitions)
  const labwareSlot = Object.values(protocolData.labware)

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
        >
          {t('protocol_setup')}
        </Text>
        <Btn size={SIZE_1} onClick={props.onCloseClick}>
          <Icon name="chevron-up" color={C_MED_DARK_GRAY}></Icon>
        </Btn>
      </Flex>
      {pipetteInfo.map(({ mount, name }, index) => (
        <Text key={index} marginTop={SPACING_1} marginBottom={SPACING_1}>
          {t('load_pipette_protocol_setup', {
            pipette_name: name,
            mount_name: mount,
          })}
        </Text>
      ))}
      {moduleInfo != null &&
        moduleInfo.map(({ slot, model }, index) => (
          <Text key={index} marginTop={SPACING_1} marginBottom={SPACING_1}>
            {t('load_modules_protocol_setup', {
              module: model,
              slot_name: slot,
            })}
          </Text>
        ))}
      {labwareInfo != null &&
        labwareInfo.map(({ namespace, metadata, version }, index) => {
          const displayName = metadata.displayName
          //   labwareSlot != null &&
          //     labwareSlot.map(({ slot }, index) => {
          return (
            <Text key={index} marginTop={SPACING_1} marginBottom={SPACING_1}>
              {t('load_labware_info_protocol_setup', {
                labware_namespace: namespace,
                labware_loadname: displayName,
                labware_version: version,
                // slot_number: slot,
              })}
            </Text>
          )
          // })
        })}
      {/* {labwareSlot != null &&
        labwareSlot.map(({ slot }, index) => (
          <Text key={index}>
            {t('labware_slot_protocol_setup', {
              slot_number: slot,
            })}
          </Text>
        ))} */}
    </Flex>
  )
}
