import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  ALIGN_FLEX_END,
  ALIGN_STRETCH,
  Box,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getTopPortalEl } from '../../../../App/portal'
import { Banner } from '../../../../atoms/Banner'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { getIsOnDevice } from '../../../../redux/config'
import { Modal } from '../../../../molecules/Modal'
import multipleModuleHelp from '../../../../assets/images/Moam_modal_image.png'
import multipleModuleHelpOdd from '../../../../assets/images/on-device-display/multiple_modules_modal.png'

const HOW_TO_MULTIPLE_MODULES_HREF =
  'https://support.opentrons.com/s/article/Using-modules-of-the-same-type-on-the-OT-2'

export function OT2MultipleModulesHelp(): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)

  const onCloseClick = () => setShowMultipleModulesModal(false)
  const isOnDevice = useSelector(getIsOnDevice)
  return (
    <>
      <Box marginTop={SPACING.spacing8}>
        <Banner
          iconMarginRight={SPACING.spacing16}
          iconMarginLeft={SPACING.spacing8}
          size={SPACING.spacing20}
          type="informing"
          onCloseClick={() => setShowMultipleModulesModal(true)}
          closeButton={
            <StyledText
              as="p"
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
              marginRight={SPACING.spacing8}
            >
              {t('learn_more')}
            </StyledText>
          }
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText css={TYPOGRAPHY.pSemiBold}>
              {t('multiple_modules')}
            </StyledText>
            <StyledText as="p">{t('view_moam')}</StyledText>
          </Flex>
        </Banner>
      </Box>
      {
        showMultipleModulesModal ?
          createPortal(
            isOnDevice ? (
              <Modal
                onOutsideClick={onCloseClick}
                modalSize="large"
                header={{
                  title: t('multiple_modules_modal'),
                  hasExitIcon: true,
                  onClick: onCloseClick,
                }}
              >
                <Flex
                  flexDirection={DIRECTION_ROW}
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                  gridGap={SPACING.spacing40}
                >
                  <StyledText as="p">{t('multiple_of_most_modules')}</StyledText>
                  <img
                    width="428px"
                    height="404px"
                    src={multipleModuleHelpOdd}
                    style={{ flex: '1 0 0', alignSelf: ALIGN_STRETCH }}
                    alt="2 temperature modules plugged into the usb ports"
                  />
                </Flex>
              </Modal>
            ) : (
              <LegacyModal
                title={t('multiple_modules_modal')}
                onClose={onCloseClick}
                width="44.75rem"
              >
                <Flex flexDirection={DIRECTION_COLUMN}>
                  <Flex flexDirection={DIRECTION_ROW}>
                    <Flex flexDirection={DIRECTION_COLUMN} marginRight="3.625rem">
                      <StyledText as="p" marginBottom={SPACING.spacing16}>
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
                        css={TYPOGRAPHY.pSemiBold}
                        marginBottom={SPACING.spacing4}
                      >
                        {t('example')}
                      </StyledText>

                      <StyledText as="p">{t('multiple_modules_example')}</StyledText>
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
              </LegacyModal>
            ),
            getTopPortalEl()
          ) : null
      }
    </>
  )
}
