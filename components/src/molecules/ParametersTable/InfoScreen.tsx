import * as React from 'react'

import { BORDERS, COLORS } from '../../helix-design-system'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants/index'
import { StyledText } from '../../atoms/StyledText'
import { Icon } from '../../icons'
import { Flex } from '../../primitives'
import { ALIGN_CENTER, DIRECTION_COLUMN } from '../../styles'

interface InfoScreenProps {
  contentType: 'parameters' | 'moduleControls' | 'runNotStarted' | 'labware'
  t?: any
}

export function InfoScreen({ contentType, t }: InfoScreenProps): JSX.Element {
  let bodyText: string = ''
  switch (contentType) {
    case 'parameters':
      bodyText =
        t != null
          ? t('no_parameters_specified_in_protocol')
          : 'No parameters specified in this protocol'
      break
    case 'moduleControls':
      bodyText =
        t != null
          ? t('connect_modules_for_controls')
          : 'Connect modules to see controls'
      break
    case 'runNotStarted':
      bodyText = t != null ? t('run_never_started') : 'Run was never started'
      break
    case 'labware':
      bodyText = 'No labware specified in this protocol'
      break
    default:
      bodyText = contentType
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      backgroundColor={COLORS.grey30}
      borderRadius={BORDERS.borderRadius8}
      padding={`${SPACING.spacing40} ${SPACING.spacing16}`}
      data-testid={`InfoScreen_${contentType}`}
    >
      <Icon
        name="ot-alert"
        size="1.25rem"
        color={COLORS.grey60}
        aria-label="alert"
      />
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {bodyText}
      </StyledText>
    </Flex>
  )
}
