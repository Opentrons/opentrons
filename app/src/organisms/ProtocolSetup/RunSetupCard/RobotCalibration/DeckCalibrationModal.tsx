import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
  Flex,
  Link,
  Box,
  Icon,
  SIZE_4,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import RobotCalHelpImage from '../../../../assets/images/robot_calibration_help.png'
import { Portal } from '../../../../App/portal'
import { Modal } from '../../../../atoms/Modal'
import { StyledText } from '../../../../atoms/text'
import { PrimaryButton } from '../../../../atoms/buttons'

const robotCalHelpArticle =
  'https://support.opentrons.com/s/article/How-positional-calibration-works-on-the-OT-2'
interface DeckCalibrationModalProps {
  onCloseClick: () => unknown
}

export function DeckCalibrationModal(
  props: DeckCalibrationModalProps
): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  const { onCloseClick } = props
  return (
    <Portal level="top">
      <Modal>
        <Box>
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {t('robot_cal_help_title')}
            </StyledText>
            <Box onClick={onCloseClick} id={'RobotCalModal_xButton'}>
              <Icon name={'close'} size="0.75rem" />
            </Box>
          </Flex>
          <StyledText as="p" marginTop={SPACING.spacing6}>
            {t('robot_cal_description')}
          </StyledText>
          <Link
            external
            css={TYPOGRAPHY.linkPSemiBold}
            href={robotCalHelpArticle}
            id={'RobotCalModal_helpArticleLink'}
          >
            {t('learn_more_about_robot_cal_link')}
            <Icon
              name={'open-in-new'}
              marginLeft={SPACING.spacing2}
              size="10px"
            />
          </Link>
          <Box textAlign={ALIGN_CENTER} marginTop={SPACING.spacing6}>
            <img src={RobotCalHelpImage} width="100%" />
          </Box>
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginTop={SPACING.spacing4}
            role={'heading'}
          >
            {t('deck_calibration_title')}
          </StyledText>
          <StyledText as="p" marginTop={SPACING.spacing4}>
            {t('deck_cal_description')}
          </StyledText>
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginTop={SPACING.spacing4}
            role={'heading'}
          >
            {t('tip_length_cal_title')}
          </StyledText>
          <StyledText as="p" marginTop={SPACING.spacing4}>
            {t('tip_length_cal_description')}
          </StyledText>
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginTop={SPACING.spacing4}
            role={'heading'}
          >
            {t('pipette_offset_cal')}
          </StyledText>
          <StyledText as="p" marginTop={SPACING.spacing4}>
            <Trans
              t={t}
              i18nKey="pipette_offset_cal_description"
              components={{
                block: <StyledText marginBottom={SPACING.spacing4} />,
              }}
            />
            <Flex flexDirection={DIRECTION_ROW} marginLeft={SPACING.spacing4}>
              <Icon
                name={'circle'}
                marginRight={SPACING.spacing2}
                marginTop={'0.35rem'}
                size="4px"
              />
              {t('pipette_offset_cal_description_bullet_1')}
            </Flex>
            <Flex flexDirection={DIRECTION_ROW} marginLeft={SPACING.spacing4}>
              <Icon
                name={'circle'}
                marginRight={SPACING.spacing2}
                marginTop={'0.35rem'}
                size="4px"
              />
              {t('pipette_offset_cal_description_bullet_2')}
            </Flex>
          </StyledText>
          <Box textAlign={ALIGN_CENTER} marginTop={SPACING.spacing5}>
            <PrimaryButton
              onClick={onCloseClick}
              width={SIZE_4}
              name="close"
              id={'RobotCalModal_closeButton'}
            >
              {t('shared:close')}
            </PrimaryButton>
          </Box>
        </Box>
      </Modal>
    </Portal>
  )
}
