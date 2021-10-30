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
import { getModuleDisplayName } from '@opentrons/shared-data'

import { useProtocolDetails } from './hooks'
import { useModuleRenderInfoById } from '../ProtocolSetup/hooks'

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
        <Flex
          flexDirection={DIRECTION_ROW}
          marginTop={SPACING_1}
          marginBottom={SPACING_1}
        >
          <Trans
            t={t}
            key={index}
            i18nKey={'load_pipette_protocol_setup'}
            values={{ pipette_name: name, mount_name: mount }}
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
        </Flex>
      ))}

      {moduleInfo != null &&
        moduleInfo.map(({ slot, model }, index) => (
          <Text key={index} marginTop={SPACING_1} marginBottom={SPACING_1}>
            {t('load_modules_protocol_setup', {
              module: getModuleDisplayName(model),
              slot_name: slot,
            })}
          </Text>
        ))}

      {labwareInfo != null &&
        labwareInfo.map(({ namespace, metadata, version }, index) => {
          const displayName = metadata.displayName
          return (
            <Flex
              flexDirection={DIRECTION_ROW}
              marginTop={SPACING_1}
              marginBottom={SPACING_1}
            >
              <Trans
                t={t}
                key={index}
                i18nKey={'load_labware_info_protocol_setup'}
                values={{
                  labware_namespace: namespace,
                  labware_loadname: displayName,
                  labware_version: version,
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
            </Flex>
          )
          // })
        })}

      {/* <Flex>
        {labwareSlot != null &&
          labwareSlot.map(({ slot }, index) => (
            <Text key={index}>
              {t('labware_slot_protocol_setup', {
                slot_number: slot,
              })}
            </Text>
          ))}
      </Flex> */}
    </Flex>
  )
}
