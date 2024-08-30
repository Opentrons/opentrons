import * as React from 'react'

import { BORDERS, COLORS } from '../../helix-design-system'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants/index'
import { LegacyStyledText } from '../../atoms/StyledText'
import { Icon } from '../../icons'
import { Flex } from '../../primitives'
import { ALIGN_CENTER, DIRECTION_COLUMN } from '../../styles'

interface InfoScreenProps {
  // contentType:
  content: string

  // | 'parameters'
  // | 'moduleControls'
  // | 'runNotStarted'
  // | 'labware'
  // | 'noFiles'
  // | 'noLabwareOffsetData'
  // t?: any
  backgroundColor?: string
}

export function InfoScreen({
  content,
  // t,
  backgroundColor = COLORS.grey30,
}: InfoScreenProps): JSX.Element {
  // let bodyText: string = ''
  // switch (contentType) {
  //   case 'parameters':
  //     bodyText =
  //       t != null
  //         ? t('no_parameters_specified_in_protocol')
  //         : 'No parameters specified in this protocol'
  //     break
  //   case 'moduleControls':
  //     bodyText =
  //       t != null
  //         ? t('connect_modules_for_controls')
  //         : 'Connect modules to see controls'
  //     break
  //   case 'runNotStarted':
  //     bodyText = t != null ? t('run_never_started') : 'Run was never started'
  //     break
  //   case 'labware':
  //     bodyText = 'No labware specified in this protocol'
  //     break
  //   case 'noFiles':
  //     bodyText =
  //       t != null ? t('no_files_included') : 'No protocol files included'
  //     break
  //   case 'noLabwareOffsetData':
  //     bodyText =
  //       t != null
  //         ? t('no_offsets_available')
  //         : 'No Labware Offset data available'
  //     break
  //   default:
  //     bodyText = contentType
  // }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      backgroundColor={backgroundColor}
      borderRadius={BORDERS.borderRadius8}
      padding={`${SPACING.spacing40} ${SPACING.spacing16}`}
      data-testid="InfoScreen"
    >
      <Icon
        name="ot-alert"
        size="1.25rem"
        color={COLORS.grey60}
        aria-label="alert"
      />
      <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {content}
      </LegacyStyledText>
    </Flex>
  )
}
