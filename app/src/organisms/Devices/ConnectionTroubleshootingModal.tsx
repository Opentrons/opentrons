import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  Flex,
  Box,
  Link,
  TYPOGRAPHY,
  SPACING,
  PrimaryButton,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { LegacyModal } from '../../molecules/LegacyModal'

const NEW_ROBOT_SETUP_SUPPORT_ARTICLE_HREF =
  'https://support.opentrons.com/s/article/Troubleshooting-connection-problems'
const SUPPORT_EMAIL = 'support@opentrons.com'

interface Props {
  onClose: () => void
}
export function ConnectionTroubleshootingModal(props: Props): JSX.Element {
  const { t } = useTranslation(['devices_landing', 'shared'])

  return (
    <LegacyModal
      title={t('why_is_this_robot_unavailable')}
      onClose={props.onClose}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p">{t('connection_troubleshooting_intro')}</StyledText>
        <TroubleshootingSteps
          label={t('if_connecting_via_usb')}
          steps={[
            t('wait_after_connecting'),
            t('make_sure_robot_is_connected'),
          ]}
        />
        <TroubleshootingSteps
          label={t('if_connecting_wirelessly')}
          steps={[t('check_same_network')]}
        />
        <TroubleshootingSteps
          label={t('if_still_having_issues')}
          steps={[t('restart_the_robot'), t('restart_the_app')]}
        />
        <StyledText as="p" marginTop={SPACING.spacing16}>
          {t('contact_support_for_connection_help', {
            support_email: SUPPORT_EMAIL,
          })}
        </StyledText>
        <Link
          external
          css={TYPOGRAPHY.linkPSemiBold}
          href={NEW_ROBOT_SETUP_SUPPORT_ARTICLE_HREF}
          marginTop={SPACING.spacing16}
          marginBottom={SPACING.spacing24}
        >
          {t('learn_more_about_troubleshooting_connection')}
        </Link>
        <PrimaryButton
          onClick={() => props.onClose()}
          alignSelf={ALIGN_FLEX_END}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >
          {t('shared:close')}
        </PrimaryButton>
      </Flex>
    </LegacyModal>
  )
}

interface TroubleshootingStepsProps {
  label: string
  steps: string[]
}
function TroubleshootingSteps(props: TroubleshootingStepsProps): JSX.Element {
  const { label, steps } = props
  return (
    <Box marginTop={SPACING.spacing16}>
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {label}:
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
