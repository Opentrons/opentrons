import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  SPACING,
  COLORS,
  Icon,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  PrimaryButton,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

export function NoUpdateFound(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.successBackgroundMed}
        height="26.625rem"
        gridGap={SPACING.spacingXXL}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <Icon
          name="check-circle"
          size="4.375rem"
          color={COLORS.successEnabled}
          data-testid="NoUpdateFound_check_circle_icon"
        />
        <StyledText
          fontSize="2rem"
          lineHeight="2.75rem"
          fontWeight="700"
          color={COLORS.black}
        >
          {t('software_is_up_to_date')}
        </StyledText>
      </Flex>
      <PrimaryButton
        marginTop={SPACING.spacing6}
        height="4.4375rem"
        onClick={() => history.push('/robot-settings/rename-robot')}
      >
        <StyledText fontSize="1.5rem" lineHeight="1.375rem" fontWeight="500">
          {t('shared:next')}
        </StyledText>
      </PrimaryButton>
    </Flex>
  )
}
