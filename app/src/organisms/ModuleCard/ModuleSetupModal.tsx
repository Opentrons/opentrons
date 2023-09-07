import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import code from '../../assets/images/module_instruction_code.png'
import {
  ALIGN_FLEX_END,
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  PrimaryButton,
  Icon,
  DIRECTION_ROW,
  Link,
} from '@opentrons/components'
import { LegacyModal } from '../../molecules/LegacyModal'
import { Portal } from '../../App/portal'

const MODULE_SETUP_URL = 'https://support.opentrons.com/s/modules'

interface ModuleSetupModalProps {
  close: () => void
  moduleDisplayName: string
}

export const ModuleSetupModal = (props: ModuleSetupModalProps): JSX.Element => {
  const { moduleDisplayName } = props
  const { t, i18n } = useTranslation(['protocol_setup', 'shared'])

  return (
    <Portal level="top">
      <LegacyModal
        title={t('modal_instructions_title', { moduleName: moduleDisplayName })}
        onClose={props.close}
        width="668px"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex flexDirection={DIRECTION_ROW} marginBottom={SPACING.spacing16}>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              marginRight="3.625rem"
              width="50%"
            >
              <StyledText as="p" marginBottom={SPACING.spacing16}>
                {t('modal_instructions')}
              </StyledText>
              <Link
                external
                css={TYPOGRAPHY.linkPSemiBold}
                href={MODULE_SETUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                marginBottom={SPACING.spacing16}
              >
                {t('module_instructions_link', {
                  moduleName: moduleDisplayName,
                })}
                <Icon
                  name="open-in-new"
                  marginLeft={SPACING.spacing4}
                  size="0.625rem"
                />
              </Link>
            </Flex>
            <img width="192px" height="194px" src={code} />
          </Flex>
          <PrimaryButton onClick={props.close} alignSelf={ALIGN_FLEX_END}>
            {i18n.format(t('shared:close'), 'capitalize')}
          </PrimaryButton>
        </Flex>
      </LegacyModal>
    </Portal>
  )
}
