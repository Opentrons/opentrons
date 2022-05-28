import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
  Flex,
  Link,
  Box,
  Icon,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  ALIGN_FLEX_END,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import RobotCalHelpImage from '../../../../assets/images/robot_calibration_help.png'
import { Portal } from '../../../../App/portal'
import { Modal } from '../../../../atoms/Modal'
import { StyledText } from '../../../../atoms/text'
import { PrimaryButton } from '../../../../atoms/buttons'
import { Line } from '../../../../atoms/structure'
import { ExternalLink } from '../../../../atoms/Link/ExternalLink'

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
      <Modal
        maxHeight="28.125rem"
        title={t('robot_cal_help_title')}
        onClose={onCloseClick}
      >
        <Box>
          <Flex
            // flexDirection={DIRECTION_ROW}
            flexDirection={DIRECTION_COLUMN}
            // alignItems={ALIGN_CENTER}
            // justifyContent={JUSTIFY_SPACE_BETWEEN}
          ></Flex>
          <StyledText
            as="p"
            marginTop={SPACING.spacing4}
            marginBottom={SPACING.spacing4}
          >
            {t('robot_cal_description')}
          </StyledText>
          <ExternalLink
            href={robotCalHelpArticle}
            id={'RobotCalModal_helpArticleLink'}
          >
            {t('learn_more_about_robot_cal_link')}
          </ExternalLink>
          <Box textAlign={ALIGN_CENTER} marginTop={SPACING.spacing4}>
            <img src={RobotCalHelpImage} width="100%" />
          </Box>
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginTop={SPACING.spacing4}
          >
            {t('deck_calibration_title')}
          </StyledText>
          <StyledText as="p" marginTop={SPACING.spacing2}>
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
          <StyledText as="p" marginTop={SPACING.spacing2}>
            {t('tip_length_cal_description')}
          </StyledText>
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginTop={SPACING.spacing4}
          >
            {t('pipette_offset_cal')}
          </StyledText>
          <StyledText as="p" marginTop={SPACING.spacing2}>
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
                name="circle"
                marginRight={SPACING.spacing2}
                marginTop="0.35rem"
                size="4px"
              />
              {t('pipette_offset_cal_description_bullet_2')}
            </Flex>
          </StyledText>
          {/* <Box textAlign={ALIGN_CENTER} marginTop={SPACING.spacing5}> */}
          {/* <PrimaryButton
            onClick={onCloseClick}
            alignSelf={ALIGN_FLEX_END}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            // width={SIZE_4}
            name="close"
            id={'RobotCalModal_closeButton'}
          >
            {t('shared:close')}
          </PrimaryButton> */}
          {/* </Box> */}
        </Box>
      </Modal>
    </Portal>
  )
}
