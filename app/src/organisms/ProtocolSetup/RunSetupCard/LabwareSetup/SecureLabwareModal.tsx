import * as React from 'react'
import snakeCase from 'lodash/snakeCase'
import { Trans, useTranslation } from 'react-i18next'
import {
  Btn,
  Box,
  Icon,
  Flex,
  Modal,
  NewPrimaryBtn,
  Text,
  C_MED_DARK_GRAY,
  FONT_WEIGHT_REGULAR,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  SIZE_2,
  SIZE_4,
  SPACING_3,
  SPACING_4,
  SPACING_5,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Portal } from '../../../../App/portal'
import secureMagModBracketImage from '../../../../assets/images/secure_mag_mod_bracket.png'
import secureTCLatchImage from '../../../../assets/images/secure_tc_latch.png'
import { getModuleName } from './utils/getModuleName'

import styles from '../../styles.css'
import type { ModuleTypesThatRequireExtraAttention } from './utils/getModuleTypesThatRequireExtraAttention'

interface SecureLabwareModalProps {
  onCloseClick: () => unknown
  type: ModuleTypesThatRequireExtraAttention
}

export const SecureLabwareModal = (
  props: SecureLabwareModalProps
): JSX.Element => {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  const moduleName = getModuleName(props.type)
  return (
    <Portal level="top">
      <Modal className={styles.modal} contentsClassName={styles.modal_contents}>
        <Box>
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
            <Text as="h3" marginBottom={SPACING_3}>
              {t(`secure_labware_modal_title`, {
                name: moduleName,
              })}
            </Text>
            <Btn size={SIZE_2} onClick={props.onCloseClick}>
              <Icon name="close" color={C_MED_DARK_GRAY}></Icon>
            </Btn>
          </Flex>

          {props.type === 'magneticModuleType' && (
            <Box>
              <Trans
                t={t}
                i18nKey={`secure_labware_explanation_${snakeCase(moduleName)}`}
                components={{
                  block: (
                    <Text
                      fontSize={TYPOGRAPHY.fontSizeH3}
                      fontWeight={FONT_WEIGHT_REGULAR}
                      marginBottom={SPACING_3}
                    />
                  ),
                }}
              />
              <Flex justifyContent={JUSTIFY_CENTER} marginY={SPACING_3}>
                <img src={secureMagModBracketImage} />
              </Flex>
              <Flex justifyContent={JUSTIFY_CENTER}>
                <Text fontSize={TYPOGRAPHY.fontSizeH3} marginX={SPACING_4}>
                  {t('magnetic_module_standard_plate_text')}
                </Text>
                <Text fontSize={TYPOGRAPHY.fontSizeH3} marginX={SPACING_4}>
                  {t('magnetic_module_deep_well_plate_text')}
                </Text>
              </Flex>
            </Box>
          )}
          {props.type === 'thermocyclerModuleType' && (
            <Box>
              <Text
                fontSize={TYPOGRAPHY.fontSizeH3}
                fontWeight={FONT_WEIGHT_REGULAR}
                marginBottom={SPACING_3}
              >
                {t(`secure_labware_explanation_${snakeCase(moduleName)}`)}
              </Text>
              <Flex justifyContent={JUSTIFY_CENTER} marginY={SPACING_3}>
                <img src={secureTCLatchImage} style={{ maxWidth: '24rem' }} />
              </Flex>
            </Box>
          )}
          <Flex
            justifyContent={JUSTIFY_CENTER}
            marginTop={SPACING_5}
            marginBottom={SPACING_3}
          >
            <NewPrimaryBtn onClick={props.onCloseClick} width={SIZE_4}>
              {t('shared:close')}
            </NewPrimaryBtn>
          </Flex>
        </Box>
      </Modal>
    </Portal>
  )
}
