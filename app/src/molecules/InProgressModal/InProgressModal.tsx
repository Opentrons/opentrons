import * as React from 'react'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

interface Props {
  //  optional override of the spinner
  alternativeSpinner?: React.ReactNode
  description?: string
  body?: string
  children?: JSX.Element
}

const DESCRIPTION_STYLE = css`
  ${TYPOGRAPHY.h1Default}
  margin-top: ${SPACING.spacing24};
  margin-bottom: ${SPACING.spacing8};

  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    font-weight: ${TYPOGRAPHY.fontWeightBold};
    font-size: ${TYPOGRAPHY.fontSize32};
    margin-top: ${SPACING.spacing32};
    margin-bottom: ${SPACING.spacing4};
    margin-left: 4.5rem;
    margin-right: 4.5rem;
    text-align: ${TYPOGRAPHY.textAlignCenter};
    line-height: ${TYPOGRAPHY.lineHeight42};
  }
`
const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular}
  text-align: ${TYPOGRAPHY.textAlignCenter};

  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    ${TYPOGRAPHY.level4HeaderRegular}
    color: ${COLORS.grey60}
  }
`
const MODAL_STYLE = css`
  align-items: ${ALIGN_CENTER};
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  padding: ${SPACING.spacing32};
  height: 24.625rem;
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    max-height: 29.5rem;
    height: 100%;
  }
`
const SPINNER_STYLE = css`
  color: ${COLORS.grey60};
  width: 5.125rem;
  height: 5.125rem;
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    width: 6.25rem;
    height: 6.25rem;
  }
`

const DESCRIPTION_CONTAINER_STYLE = css`
  padding-x: 6.5625rem;
  gap: ${SPACING.spacing8};
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    padding-x: ${SPACING.spacing40};
    gap: ${SPACING.spacing4};
  }
`

export function InProgressModal(props: Props): JSX.Element {
  const { alternativeSpinner, children, description, body } = props

  return (
    <Flex css={MODAL_STYLE}>
      {alternativeSpinner ?? (
        <Icon name="ot-spinner" aria-label="spinner" css={SPINNER_STYLE} spin />
      )}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        css={DESCRIPTION_CONTAINER_STYLE}
      >
        {description != null && (
          <LegacyStyledText css={DESCRIPTION_STYLE}>
            {description}
          </LegacyStyledText>
        )}
        {body != null && (
          <LegacyStyledText css={BODY_STYLE}>{body}</LegacyStyledText>
        )}
      </Flex>
      {children}
    </Flex>
  )
}
