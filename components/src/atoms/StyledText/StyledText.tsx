import styled, { css } from 'styled-components'
import { Text } from '../../primitives'
import { TYPOGRAPHY, RESPONSIVENESS } from '../../ui-style-constants'
import { TYPOGRAPHY as HELIX_TYPOGRAPHY } from '../../helix-design-system/product'

import type * as React from 'react'
import type { FlattenSimpleInterpolation } from 'styled-components'

const helixProductStyleMap = {
  displayBold: {
    as: 'h1',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleDisplayBold};
      }
    `,
  },
  headingLargeRegular: {
    as: 'h2',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleHeadingLargeRegular};
      }
    `,
  },
  headingLargeBold: {
    as: 'h2',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleHeadingLargeBold};
      }
    `,
  },
  headingMediumSemiBold: {
    as: 'h3',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleHeadingMediumSemiBold};
      }
    `,
  },
  headingSmallRegular: {
    as: 'h4',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleHeadingSmallRegular};
      }
    `,
  },
  headingSmallBold: {
    as: 'h4',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleHeadingSmallBold};
      }
    `,
  },
  bodyLargeSemiBold: {
    as: 'p',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleBodyLargeSemiBold};
      }
    `,
  },
  bodyLargeRegular: {
    as: 'p',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleBodyLargeRegular};
      }
    `,
  },
  bodyDefaultSemiBold: {
    as: 'p',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleBodyDefaultSemiBold};
      }
    `,
  },
  bodyDefaultRegular: {
    as: 'p',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleBodyDefaultRegular};
      }
    `,
  },
  captionSemiBold: {
    as: 'label',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleCaptionSemiBold};
      }
    `,
  },
  captionRegular: {
    as: 'label',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleCaptionRegular};
      }
    `,
  },
  codeRegular: {
    as: 'p',
    style: css`
      @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
        font: ${HELIX_TYPOGRAPHY.fontStyleCodeRegular};
      }
    `,
  },
} as const

const ODDStyleMap = {
  level1Header: {
    as: 'h1',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.level1Header};
      }
    `,
  },
  level2HeaderRegular: {
    as: 'h2',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.level2HeaderRegular};
      }
    `,
  },
  level2HeaderSemiBold: {
    as: 'h2',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.level2HeaderSemiBold}
      }
    `,
  },
  level2HeaderBold: {
    as: 'h2',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.level2HeaderBold}
      }
    `,
  },

  level3HeaderRegular: {
    as: 'h3',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.level3HeaderRegular};
      }
    `,
  },
  level3HeaderSemiBold: {
    as: 'h3',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.level3HeaderSemiBold}
      }
    `,
  },

  level3HeaderBold: {
    as: 'h3',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.level3HeaderBold}
      }
    `,
  },

  level4HeaderRegular: {
    as: 'h4',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.level4HeaderRegular};
      }
    `,
  },
  level4HeaderBold: {
    as: 'h4',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.level4HeaderBold}
      }
    `,
  },

  bodyTextRegular: {
    as: 'p',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.bodyTextRegular}
      }
    `,
  },
  bodyTextSemiBold: {
    as: 'p',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.bodyTextSemiBold}
      }
    `,
  },
  bodyTextBold: {
    as: 'p',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.bodyTextBold}
      }
    `,
  },
  smallBodyTextRegular: {
    as: 'label',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.smallBodyTextRegular}
      }
    `,
  },

  smallBodyTextSemiBold: {
    as: 'label',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        font-size: ${TYPOGRAPHY.fontSize20};
        line-height: ${TYPOGRAPHY.lineHeight24};
      }
    `,
  },

  smallBodyTextBold: {
    as: 'label',
    style: css`
      @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
        ${TYPOGRAPHY.smallBodyTextBold}
      }
    `,
  },
} as const

export interface Props extends React.ComponentProps<typeof Text> {
  oddStyle?: ODDStyles
  desktopStyle?: HelixStyles
  children?: React.ReactNode
}
export const ODD_STYLES = Object.keys(ODDStyleMap)
export const HELIX_STYLES = Object.keys(helixProductStyleMap)
export type HelixStyles = keyof typeof helixProductStyleMap
export type ODDStyles = keyof typeof ODDStyleMap

function styleForDesktopName(name?: HelixStyles): FlattenSimpleInterpolation {
  return name ? helixProductStyleMap[name].style : css``
}

function styleForODDName(name?: ODDStyles): FlattenSimpleInterpolation {
  return name ? ODDStyleMap[name].style : css``
}

// this is some artifact of the way styled-text forwards arguments.
/* eslint-disable @typescript-eslint/no-unsafe-argument */
const DesktopStyledText: (props: Props) => JSX.Element = styled(Text)<Props>`
  ${props => styleForDesktopName(props.desktopStyle)}
`
/* eslint-enable @typescript-eslint/no-unsafe-argument */

export const StyledText: (props: Props) => JSX.Element = styled(
  DesktopStyledText
)<Props>`
  ${props => styleForODDName(props.oddStyle)}
`
