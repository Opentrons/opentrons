import * as React from 'react'
import snakeCase from 'lodash/snakeCase'
import { Trans, useTranslation } from 'react-i18next'
import lowerCase from 'lodash/lowerCase'
import {
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  DIRECTION_ROW,
  SPACING,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { Portal } from '../../../../App/portal'
import { StyledText } from '../../../../atoms/text'
import { PrimaryButton } from '../../../../atoms/buttons'
import { Modal } from '../../../../molecules/Modal'
import secureMagModBracketImage from '../../../../assets/images/secure_mag_mod_bracket.png'
import secureTCLatchImage from '../../../../assets/images/secure_tc_latch.png'
import { getModuleName } from './utils/getModuleName'

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
      <Modal
        title={t(`secure_labware_modal`, {
          name: lowerCase(moduleName),
        })}
        onClose={props.onCloseClick}
        modalwidth="44.75rem"
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
                  i18nKey={`secure_labware_explanation_${snakeCase(
                    moduleName
                  )}`}
                  components={{
                    block: (
                      <StyledText
                        as="p"
                        marginBottom={SPACING.spacing2}
                        marginRight="3.625rem"
                      />
                    ),
                  }}
                />
              </Flex>
              <img width="288px" height="100%" src={secureMagModBracketImage} />
            </Flex>
          )}
          {props.type === 'thermocyclerModuleType' && (
            <Flex
              flexDirection={DIRECTION_ROW}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
            >
              <StyledText as="p" marginRight="3.625rem">
                {t(`secure_labware_explanation_${snakeCase(moduleName)}`)}
              </StyledText>
              <img src={secureTCLatchImage} width="288px" height="100%" />
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
      </Modal>
    </Portal>
  )
}
