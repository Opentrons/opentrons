import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import code from '../../assets/images/module_instruction_code.png'
import {
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  Link,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { LegacyModal } from '../../molecules/LegacyModal'
import { getTopPortalEl } from '../../App/portal'

const MODULE_SETUP_URL = 'https://support.opentrons.com/s/modules'

interface ModuleSetupModalProps {
  close: () => void
  moduleDisplayName: string
}

export const ModuleSetupModal = (props: ModuleSetupModalProps): JSX.Element => {
  const { moduleDisplayName } = props
  const { t, i18n } = useTranslation(['protocol_setup', 'shared', 'branded'])

  return createPortal(
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
              {t('branded:modal_instructions')}
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
    </LegacyModal>,
    getTopPortalEl()
  )
}
