import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Box,
  DIRECTION_COLUMN,
  Flex,
  PrimaryButton,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
  Modal,
  LegacyStyledText,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import RobotCalHelpImage from '/app/assets/images/robot_calibration_help.png'
import { ExternalLink } from '/app/atoms/Link/ExternalLink'
import { Divider } from '/app/atoms/structure'

const ROBOT_CAL_HELP_ARTICLE =
  'https://support.opentrons.com/s/article/How-positional-calibration-works-on-the-OT-2'
interface HowCalibrationWorksModalProps {
  onCloseClick: () => unknown
}

export function HowCalibrationWorksModal({
  onCloseClick,
}: HowCalibrationWorksModalProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  return createPortal(
    <Modal
      title={t('robot_cal_help_title')}
      onClose={onCloseClick}
      maxHeight="28.125rem"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText as="p" marginBottom={SPACING.spacing16}>
          {t('robot_cal_description')}
        </LegacyStyledText>
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
        <LegacyStyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing16}
          role="heading"
        >
          {t('deck_calibration_title')}
        </LegacyStyledText>
        <CalibrationSteps
          description={t('deck_cal_description')}
          steps={[
            t('deck_cal_description_bullet_1'),
            t('deck_cal_description_bullet_2'),
          ]}
        />
        <LegacyStyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing16}
          role="heading"
        >
          {t('tip_length_cal_title')}
        </LegacyStyledText>
        <CalibrationSteps
          description={t('tip_length_cal_description')}
          steps={[t('tip_length_cal_description_bullet')]}
        />
        {/* pipette offset calibration */}
        <LegacyStyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing16}
          role="heading"
        >
          {t('pipette_offset_cal')}
        </LegacyStyledText>
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
    </Modal>,
    getTopPortalEl()
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
      <LegacyStyledText as="p" marginBottom={SPACING.spacing8}>
        {description}
      </LegacyStyledText>
      <ul>
        {steps.map(step => (
          <li
            css={css`
              margin-left: ${SPACING.spacing24};
            `}
            key={step}
          >
            <LegacyStyledText as="p">{step}</LegacyStyledText>
          </li>
        ))}
      </ul>
    </Box>
  )
}
