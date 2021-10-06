import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
  Text,
  Flex,
  Link,
  Box,
  Icon,
  BaseModal,
  PrimaryBtn,
  SPACING_3,
  SPACING_4,
  SIZE_1,
  SIZE_2,
  SIZE_4,
  C_BLUE,
  FONT_HEADER_DARK,
  FONT_BODY_1_DARK,
  DIRECTION_ROW,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_BODY_1,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_1,
  FONT_WEIGHT_REGULAR,
} from '@opentrons/components'
import RobotCalHelpImage from '../../../../assets/images/robot_calibration_help.png'
import { Portal } from '../../../../App/portal'

const robotCalHelpArticle =
  'https://support.opentrons.com/en/articles/3499692-how-positional-calibration-works-on-the-ot-2'

interface DeckCalibrationModalProps {
  onCloseClick: () => unknown
}

export const DeckCalibrationModal = (
  props: DeckCalibrationModalProps
): JSX.Element => {
  const { t } = useTranslation(['protocol_setup', 'shared'])

  return (
    <Portal level={'top'}>
      <BaseModal borderRadius={SIZE_1}>
        <Box>
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Text css={FONT_HEADER_DARK}>{t('robot_cal_help_title')}</Text>
            <Box onClick={props.onCloseClick} id={'RobotCalModal_xButton'}>
              <Icon name={'close'} size={SIZE_2} />
            </Box>
          </Flex>
          <Text css={FONT_BODY_1_DARK} marginTop={SPACING_4}>
            {t('robot_cal_description')}
          </Text>
          <Link
            fontSize={FONT_SIZE_BODY_1}
            color={C_BLUE}
            href={robotCalHelpArticle}
            id={'RobotCalModal_helpArticleLink'}
            rel="noopener noreferrer"
          >
            {t('learn_more_about_robot_cal_link')}
            <Icon name={'open-in-new'} marginLeft={SPACING_1} size="10px" />
          </Link>
          <Box textAlign={ALIGN_CENTER} marginTop={SPACING_4}>
            <img src={RobotCalHelpImage} width="100%" />
          </Box>
          <Text
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            fontSize={FONT_SIZE_BODY_1}
            marginTop={SPACING_3}
            role={'heading'}
          >
            {t('deck_calibration_title')}
          </Text>
          <Text fontSize={FONT_SIZE_BODY_1} marginTop={SPACING_3}>
            {t('deck_cal_description')}
          </Text>
          <Text
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            fontSize={FONT_SIZE_BODY_1}
            marginTop={SPACING_3}
            role={'heading'}
          >
            {t('tip_length_cal_title')}
          </Text>
          <Text fontSize={FONT_SIZE_BODY_1} marginTop={SPACING_3}>
            {t('tip_length_cal_description')}
          </Text>
          <Text
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            fontSize={FONT_SIZE_BODY_1}
            marginTop={SPACING_3}
            role={'heading'}
          >
            {t('pipette_offset_cal')}
          </Text>
          <Text fontSize={FONT_SIZE_BODY_1} marginTop={SPACING_3}>
            <Trans
              t={t}
              i18nKey="pipette_offset_cal_description"
              components={{
                block: (
                  <Text
                    fontSize={FONT_SIZE_BODY_1}
                    fontWeight={FONT_WEIGHT_REGULAR}
                    marginBottom={SPACING_3}
                  />
                ),
              }}
            />
            <Flex flexDirection={DIRECTION_ROW} marginLeft={SPACING_3}>
              <Icon
                name={'circle'}
                marginRight={SPACING_1}
                marginTop={'0.35rem'}
                size="5px"
              />
              {t('pipette_offset_cal_description_bullet_1')}
            </Flex>
            <Flex flexDirection={DIRECTION_ROW} marginLeft={SPACING_3}>
              <Icon
                name={'circle'}
                marginRight={SPACING_1}
                marginTop={'0.35rem'}
                size="5px"
              />
              {t('pipette_offset_cal_description_bullet_2')}
            </Flex>
          </Text>
          <Box textAlign={ALIGN_CENTER} marginTop={SPACING_4}>
            <PrimaryBtn
              onClick={props.onCloseClick}
              width={SIZE_4}
              backgroundColor={C_BLUE}
              name="close"
              id={'RobotCalModal_closeButton'}
            >
              {t('shared:close')}
            </PrimaryBtn>
          </Box>
        </Box>
      </BaseModal>
    </Portal>
  )
}
