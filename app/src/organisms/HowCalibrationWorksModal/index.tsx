import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
  PrimaryButton,
} from '@opentrons/components'

import { Portal } from '../../App/portal'
import RobotCalHelpImage from '../../assets/images/robot_calibration_help.png'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'
import { LegacyModal } from '../../molecules/LegacyModal'

const ROBOT_CAL_HELP_ARTICLE =
  'https://support.opentrons.com/s/article/How-positional-calibration-works-on-the-OT-2'
interface HowCalibrationWorksModalProps {
  onCloseClick: () => unknown
}

export function HowCalibrationWorksModal({
  onCloseClick,
}: HowCalibrationWorksModalProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  return (
    <Portal level="top">
      <LegacyModal
        title={t('robot_cal_help_title')}
        onClose={onCloseClick}
        maxHeight="28.125rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText as="p" marginBottom={SPACING.spacing16}>
            {t('robot_cal_description')}
          </StyledText>
          <ExternalLink
            href={ROBOT_CAL_HELP_ARTICLE}
            id="RobotCalModal_helpArticleLink"
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
          >
            {t('learn_more_about_robot_cal_link')}
          </ExternalLink>
          <Box textAlign={ALIGN_CENTER} marginTop={SPACING.spacing16}>
            <img src={RobotCalHelpImage} width="100%" />
          </Box>
          {/* deck calibration */}
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginTop={SPACING.spacing16}
            role="heading"
          >
            {t('deck_calibration_title')}
          </StyledText>
          <CalibrationSteps
            description={t('deck_cal_description')}
            steps={[
              t('deck_cal_description_bullet_1'),
              t('deck_cal_description_bullet_2'),
            ]}
          />
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginTop={SPACING.spacing16}
            role="heading"
          >
            {t('tip_length_cal_title')}
          </StyledText>
          <CalibrationSteps
            description={t('tip_length_cal_description')}
            steps={[t('tip_length_cal_description_bullet')]}
          />
          {/* pipette offset calibration */}
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginTop={SPACING.spacing16}
            role="heading"
          >
            {t('pipette_offset_cal')}
          </StyledText>
          <CalibrationSteps
            description={t('pipette_offset_cal_description')}
            steps={[
              t('pipette_offset_cal_description_bullet_1'),
              t('pipette_offset_cal_description_bullet_2'),
              t('pipette_offset_cal_description_bullet_3'),
            ]}
          />
          <Divider
            marginTop={SPACING.spacing40}
            marginBottom={SPACING.spacing16}
          />
          <PrimaryButton
            onClick={onCloseClick}
            alignSelf={ALIGN_FLEX_END}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('shared:close')}
          </PrimaryButton>
        </Flex>
      </LegacyModal>
    </Portal>
  )
}

interface CalibrationStepsProps {
  description: string
  steps: string[]
}
function CalibrationSteps({
  description,
  steps,
}: CalibrationStepsProps): JSX.Element {
  return (
    <Box marginTop={SPACING.spacing4}>
      <StyledText as="p" marginBottom={SPACING.spacing8}>
        {description}
      </StyledText>
      <ul>
        {steps.map(step => (
          <li
            css={css`
              margin-left: ${SPACING.spacing24};
            `}
            key={step}
          >
            <StyledText as="p">{step}</StyledText>
          </li>
        ))}
      </ul>
    </Box>
  )
}
