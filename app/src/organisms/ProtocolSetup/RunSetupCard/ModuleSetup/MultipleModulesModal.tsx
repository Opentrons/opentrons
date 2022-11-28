import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Link,
  Icon,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  ALIGN_FLEX_END,
  DIRECTION_ROW,
} from '@opentrons/components'
import { Portal } from '../../../../App/portal'
import { Modal } from '../../../../molecules/Modal'
import multipleModuleHelp from '../../../../assets/images/Moam_modal_image.png'
import { PrimaryButton } from '../../../../atoms/buttons'
import { StyledText } from '../../../../atoms/text'

const HOW_TO_MULTIPLE_MODULES_HREF =
  'https://support.opentrons.com/s/article/Using-modules-of-the-same-type-on-the-OT-2'

interface MultipleModulesModalProps {
  onCloseClick: () => unknown
}

export const MultipleModulesModal = (
  props: MultipleModulesModalProps
): JSX.Element => {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  return (
    <Portal level="top">
      <Modal
        title={t('multiple_modules_modal_title')}
        onClose={props.onCloseClick}
        modalwidth="44.75rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex flexDirection={DIRECTION_ROW}>
            <Flex flexDirection={DIRECTION_COLUMN} marginRight="3.625rem">
              <StyledText as="p" marginBottom={SPACING.spacing4}>
                {t('multiple_modules_explanation')}
              </StyledText>
              <Link
                external
                css={TYPOGRAPHY.linkPSemiBold}
                href={HOW_TO_MULTIPLE_MODULES_HREF}
                target="_blank"
                rel="noopener noreferrer"
                marginBottom={SPACING.spacing4}
              >
                <Flex flexDirection={DIRECTION_ROW}>
                  {t('multiple_modules_link')}
                  <Icon
                    name="open-in-new"
                    marginLeft={SPACING.spacing2}
                    size="0.625rem"
                    marginTop={SPACING.spacing4}
                  />
                </Flex>
              </Link>
              <StyledText
                css={TYPOGRAPHY.pSemiBold}
                marginBottom={SPACING.spacing2}
              >
                {t('example')}
              </StyledText>

              <StyledText as="p">{t('multiple_modules_example')}</StyledText>
            </Flex>
            <img
              src={multipleModuleHelp}
              style={{ marginBottom: SPACING.spacing4 }}
            />
          </Flex>
          <PrimaryButton
            onClick={props.onCloseClick}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            marginRight={SPACING.spacing5}
            alignSelf={ALIGN_FLEX_END}
          >
            {t('shared:close')}
          </PrimaryButton>
        </Flex>
      </Modal>
    </Portal>
  )
}
