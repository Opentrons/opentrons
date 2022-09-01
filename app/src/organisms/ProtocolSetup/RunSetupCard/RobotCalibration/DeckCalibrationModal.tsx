import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  Box,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  ALIGN_FLEX_END,
} from '@opentrons/components'

import RobotCalHelpImage from '../../../../assets/images/robot_calibration_help.png'
import { Portal } from '../../../../App/portal'
import { Modal } from '../../../../molecules/Modal'
import { StyledText } from '../../../../atoms/text'
import { PrimaryButton } from '../../../../atoms/buttons'
import { ExternalLink } from '../../../../atoms/Link/ExternalLink'
import { Divider } from '../../../../atoms/structure'

const ROBOT_CAL_HELP_ARTICLE =
  'https://support.opentrons.com/s/article/How-positional-calibration-works-on-the-OT-2'
interface DeckCalibrationModalProps {
  onCloseClick: () => unknown
}

export function DeckCalibrationModal({
  onCloseClick,
}: DeckCalibrationModalProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  return (
    <Portal level="top">
      <Modal
        title={t('robot_cal_help_title')}
        onClose={onCloseClick}
        maxHeight="28.125rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText as="p" marginBottom={SPACING.spacing4}>
            {t('robot_cal_description')}
          </StyledText>
          <ExternalLink
            href={ROBOT_CAL_HELP_ARTICLE}
            id="RobotCalModal_helpArticleLink"
          >
            {t('learn_more_about_robot_cal_link')}
          </ExternalLink>
          <Box textAlign={ALIGN_CENTER} marginTop={SPACING.spacing4}>
            <img src={RobotCalHelpImage} width="100%" />
          </Box>
          {/* deck calibration */}
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            marginTop={SPACING.spacing4}
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
            marginTop={SPACING.spacing4}
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
            marginTop={SPACING.spacing4}
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
            marginTop={SPACING.spacingXXL}
            marginBottom={SPACING.spacing4}
          />
          <PrimaryButton
            onClick={onCloseClick}
            alignSelf={ALIGN_FLEX_END}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('shared:close')}
          </PrimaryButton>
        </Flex>
      </Modal>
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
    <Box marginTop={SPACING.spacing2}>
      <StyledText as="p" marginBottom={SPACING.spacing3}>
        {description}
      </StyledText>
      <ul>
        {steps.map(step => (
          <li
            css={css`
              margin-left: ${SPACING.spacing5};
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
