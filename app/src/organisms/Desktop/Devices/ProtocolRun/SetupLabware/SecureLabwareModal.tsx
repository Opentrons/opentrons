import { createPortal } from 'react-dom'
import snakeCase from 'lodash/snakeCase'
import { Trans, useTranslation } from 'react-i18next'
import {
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  Modal,
} from '@opentrons/components'
import { getTopPortalEl } from '/app/App/portal'
import secureMagModBracketImage from '/app/assets/images/secure_mag_mod_bracket.png'
import secureTCLatchImage from '/app/assets/images/secure_tc_latch.png'
import { getModuleName } from '../utils/getModuleName'

import type { ModuleTypesThatRequireExtraAttention } from '../utils/getModuleTypesThatRequireExtraAttention'

interface SecureLabwareModalProps {
  onCloseClick: () => unknown
  type: ModuleTypesThatRequireExtraAttention
}

export const SecureLabwareModal = (
  props: SecureLabwareModalProps
): JSX.Element => {
  const { t } = useTranslation(['protocol_setup', 'shared', 'branded'])
  const moduleName = getModuleName(props.type)
  return createPortal(
    <Modal
      title={t(`secure_labware_modal`, {
        name: moduleName,
      })}
      onClose={props.onCloseClick}
      width="44.75rem"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        {props.type === 'magneticModuleType' && (
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <Trans
                t={t}
                i18nKey={`branded:secure_labware_explanation_${snakeCase(
                  moduleName
                )}`}
                components={{
                  block: (
                    <LegacyStyledText
                      as="p"
                      marginBottom={SPACING.spacing4}
                      marginRight="3.625rem"
                    />
                  ),
                }}
              />
            </Flex>
            <img
              width="288px"
              height="100%"
              src={secureMagModBracketImage}
              style={{ marginBottom: SPACING.spacing24 }}
            />
          </Flex>
        )}
        {props.type === 'thermocyclerModuleType' && (
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <LegacyStyledText as="p" marginRight="3.625rem">
              {t(`branded:secure_labware_explanation_${snakeCase(moduleName)}`)}
            </LegacyStyledText>
            <img
              src={secureTCLatchImage}
              width="288px"
              height="100%"
              style={{ marginBottom: SPACING.spacing16 }}
            />
          </Flex>
        )}
        <PrimaryButton
          onClick={props.onCloseClick}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          alignSelf={ALIGN_FLEX_END}
        >
          {t('shared:close')}
        </PrimaryButton>
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}
