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
  JUSTIFY_CENTER,
  BORDERS,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { MediumButton } from '../../atoms/buttons'

export function NoUpdateFound(): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      gridGap={SPACING.spacing32}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.green3}
        height="25.75rem"
        gridGap={SPACING.spacing40}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        borderRadius={BORDERS.size3}
      >
        <Icon
          name="ot-check"
          size="3.75rem"
          color={COLORS.green2}
          data-testid="NoUpdateFound_check_circle_icon"
        />
        <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {t('software_is_up_to_date')}
        </StyledText>
      </Flex>
      <MediumButton
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClick={() => history.push('/robot-settings/rename-robot')}
      />
    </Flex>
  )
}
