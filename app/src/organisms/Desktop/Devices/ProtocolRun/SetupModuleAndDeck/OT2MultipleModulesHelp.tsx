import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_FLEX_END,
  Banner,
  Box,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  Link,
  Modal,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import multipleModuleHelp from '/app/assets/images/Moam_modal_image.png'

import type { ReactNode } from 'react'

const HOW_TO_MULTIPLE_MODULES_HREF =
  'https://support.opentrons.com/s/article/Using-modules-of-the-same-type-on-the-OT-2'

export function OT2MultipleModulesHelp(): ReactNode {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  const [showMultipleModulesModal, setShowMultipleModulesModal] =
    useState<boolean>(false)

  const onCloseClick = (): void => {
    setShowMultipleModulesModal(false)
  }
  return (
    <>
      <Box marginTop={SPACING.spacing8}>
        <Banner
          iconMarginRight={SPACING.spacing16}
          iconMarginLeft={SPACING.spacing8}
          size={SPACING.spacing20}
          type="informing"
          onCloseClick={() => {
            setShowMultipleModulesModal(true)
          }}
          closeButton={
            <StyledText
              forwardedAs="p"
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
              marginRight={SPACING.spacing8}
            >
              {t('learn_more')}
            </StyledText>
          }
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText
              forwardedAs="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {t('multiple_modules')}
            </StyledText>
            <StyledText forwardedAs="p">{t('view_moam')}</StyledText>
          </Flex>
        </Banner>
      </Box>
      {showMultipleModulesModal
        ? createPortal(
            <Modal
              title={t('multiple_modules_modal')}
              onClose={onCloseClick}
              width="44.75rem"
            >
              <Flex flexDirection={DIRECTION_COLUMN}>
                <Flex flexDirection={DIRECTION_ROW}>
                  <Flex flexDirection={DIRECTION_COLUMN} marginRight="3.625rem">
                    <StyledText
                      forwardedAs="p"
                      marginBottom={SPACING.spacing16}
                    >
                      {t('multiple_modules_explanation')}
                    </StyledText>
                    <Link
                      external
                      css={TYPOGRAPHY.linkPSemiBold}
                      href={HOW_TO_MULTIPLE_MODULES_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      marginBottom={SPACING.spacing16}
                    >
                      {t('multiple_modules_learn_more')}
                      <Icon
                        name="open-in-new"
                        marginLeft={SPACING.spacing4}
                        size="0.625rem"
                      />
                    </Link>
                    <StyledText
                      forwardedAs="p"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                      marginBottom={SPACING.spacing4}
                    >
                      {t('example')}
                    </StyledText>

                    <StyledText forwardedAs="p">
                      {t('multiple_modules_example')}
                    </StyledText>
                  </Flex>
                  <img
                    height="100%"
                    width="288px"
                    src={multipleModuleHelp}
                    style={{ marginBottom: SPACING.spacing16 }}
                    alt="2 temperature modules plugged into the usb ports"
                  />
                </Flex>
                <PrimaryButton
                  onClick={onCloseClick}
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                  alignSelf={ALIGN_FLEX_END}
                >
                  {t('shared:close')}
                </PrimaryButton>
              </Flex>
            </Modal>,
            getTopPortalEl()
          )
        : null}
    </>
  )
}
