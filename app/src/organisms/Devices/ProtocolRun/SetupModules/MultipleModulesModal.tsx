import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Flex,
  Link,
  Icon,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  PrimaryButton,
  ALIGN_FLEX_END,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_STRETCH,
} from '@opentrons/components'
import { Portal } from '../../../../App/portal'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { StyledText } from '../../../../atoms/text'
import { getIsOnDevice } from '../../../../redux/config'
import { Modal } from '../../../../molecules/Modal'
import multipleModuleHelp from '../../../../assets/images/Moam_modal_image.png'
import multipleModuleHelpOdd from '../../../../assets/images/on-device-display/multiple_modules_modal.png'

const HOW_TO_MULTIPLE_MODULES_HREF =
  'https://support.opentrons.com/s/article/Using-modules-of-the-same-type-on-the-OT-2'

interface MultipleModulesModalProps {
  onCloseClick: () => unknown
}

export const MultipleModulesModal = (
  props: MultipleModulesModalProps
): JSX.Element => {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  const isOnDevice = useSelector(getIsOnDevice)
  return (
    <Portal level="top">
      {isOnDevice ? (
        <Modal
          onOutsideClick={props.onCloseClick}
          modalSize="large"
          header={{
            title: t('multiple_modules_modal'),
            hasExitIcon: true,
            onClick: props.onCloseClick,
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
          onClose={props.onCloseClick}
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
              onClick={props.onCloseClick}
              textTransform={TYPOGRAPHY.textTransformCapitalize}
              alignSelf={ALIGN_FLEX_END}
            >
              {t('shared:close')}
            </PrimaryButton>
          </Flex>
        </LegacyModal>
      )}
    </Portal>
  )
}
