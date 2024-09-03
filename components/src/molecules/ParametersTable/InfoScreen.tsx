import * as React from 'react'

import { BORDERS, COLORS } from '../../helix-design-system'
import { RESPONSIVENESS, SPACING } from '../../ui-style-constants/index'
import { StyledText } from '../../atoms/StyledText'
import { Icon } from '../../icons'
import { Flex } from '../../primitives'
import { ALIGN_CENTER, DIRECTION_COLUMN, JUSTIFY_CENTER } from '../../styles'
import { css } from 'styled-components'

interface InfoScreenProps {
  contentType:
    | 'parameters'
    | 'moduleControls'
    | 'runNotStarted'
    | 'labware'
    | 'noFiles'
    | 'noLabwareOffsetData'
    | 'noLabwareOffsetDataYet'
  t?: any
  backgroundColor?: string
  height?: string
}

export function InfoScreen(props: InfoScreenProps): JSX.Element {
  const { contentType, t, backgroundColor } = props
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
    case 'noFiles':
      bodyText =
        t != null ? t('no_files_included') : 'No protocol files included'
      break
    case 'noLabwareOffsetData':
      bodyText =
        t != null
          ? t('no_offsets_available')
          : 'No Labware Offset data available'
      break
    case 'noLabwareOffsetDataYet':
      bodyText =
        t != null ? t('no_labware_offset_data') : 'No labware offset data yet'
      break
    default:
      bodyText = contentType
  }

  return (
    <Flex
      data-testid={`InfoScreen_${contentType}`}
      css={css`
        width: 100%;
        padding: ${SPACING.spacing40} ${SPACING.spacing16};
        grid-gap: ${SPACING.spacing12};
        flex-direction: ${DIRECTION_COLUMN};
        background-color: ${backgroundColor ?? COLORS.grey30};
        border-radius: ${BORDERS.borderRadius8};
        align-items: ${ALIGN_CENTER};
        justify-content: ${JUSTIFY_CENTER};
        > svg {
          height: 1.25rem;
          width: 1.25rem;
        }
        @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
          height: 27.25rem;
          padding: 0;
          grid-gap: ${SPACING.spacing32};
          background-color: ${backgroundColor ?? COLORS.grey35};
          border-radius: ${BORDERS.borderRadius12};
          > svg {
            height: 3rem;
            width: 3rem;
          }
        }
      `}
    >
      <Icon
        name="ot-alert"
        size="1.25rem"
        color={COLORS.grey60}
        aria-label="alert"
      />
      <StyledText
        desktopStyle="bodyDefaultSemiBold"
        oddStyle="level3HeaderSemiBold"
      >
        {bodyText}
      </StyledText>
    </Flex>
  )
}
