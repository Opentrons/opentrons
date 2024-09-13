import styled, { css } from 'styled-components'
import { Text } from '../../primitives'
import { TYPOGRAPHY, RESPONSIVENESS } from '../../ui-style-constants'

import type * as React from 'react'
import type { FlattenSimpleInterpolation } from 'styled-components'

export interface LegacyProps extends React.ComponentProps<typeof Text> {
  children?: React.ReactNode
}

const styleMap: { [tag: string]: FlattenSimpleInterpolation } = {
  h1: css`
    ${TYPOGRAPHY.h1Default};
    body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
      ${TYPOGRAPHY.level1Header};
    }
  `,
  h2: css`
    ${TYPOGRAPHY.h2Regular}
    body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
      ${TYPOGRAPHY.level2HeaderRegular};
    }
  `,
  h3: css`
    ${TYPOGRAPHY.h3Regular}
    body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
      ${TYPOGRAPHY.level3HeaderRegular};
    }
  `,
  h4: css`
    body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
      ${TYPOGRAPHY.level4HeaderRegular};
    }
  `,
  h6: TYPOGRAPHY.h6Default,
  p: css`
    ${TYPOGRAPHY.pRegular}
    body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
      ${TYPOGRAPHY.bodyTextRegular}
    }
  `,
  label: css`
    ${TYPOGRAPHY.labelRegular}
    body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
      ${TYPOGRAPHY.smallBodyTextRegular}
    }
  `,
  h2SemiBold: css`
    ${TYPOGRAPHY.h2SemiBold}
    body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
      ${TYPOGRAPHY.level2HeaderSemiBold}
    }
  `,
  h3SemiBold: css`
    ${TYPOGRAPHY.h3SemiBold}
    body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
      ${TYPOGRAPHY.level3HeaderSemiBold}
    }
  `,
  h4SemiBold: TYPOGRAPHY.level4HeaderSemiBold,
  h6SemiBold: TYPOGRAPHY.h6SemiBold,
  pSemiBold: css`
    ${TYPOGRAPHY.pSemiBold}
    body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
      ${TYPOGRAPHY.bodyTextSemiBold}
    }
  `,
  labelSemiBold: css`
    ${TYPOGRAPHY.labelSemiBold}
    body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
      font-size: ${TYPOGRAPHY.fontSize20};
      line-height: ${TYPOGRAPHY.lineHeight24};
    }
  `,
  h2Bold: TYPOGRAPHY.level2HeaderBold,
  h3Bold: TYPOGRAPHY.level3HeaderBold,
  h4Bold: TYPOGRAPHY.level4HeaderBold,
  pBold: TYPOGRAPHY.bodyTextBold,
  labelBold: TYPOGRAPHY.smallBodyTextBold,
}

export const LegacyStyledText: (props: LegacyProps) => JSX.Element = styled(
  Text
)<LegacyProps>`
  ${props => {
    let fontWeight = ''
    if (props.fontWeight === TYPOGRAPHY.fontWeightSemiBold) {
      fontWeight = 'SemiBold'
    } else if (props.fontWeight === TYPOGRAPHY.fontWeightBold) {
      fontWeight = 'Bold'
    }
    return styleMap[`${props.as}${fontWeight}`]
  }}
`
