import { css } from '@linaria/core'

import { Text } from '../../primitives'
import { RESPONSIVENESS, TYPOGRAPHY } from '../../ui-style-constants'

import type React from 'react'
import type { ComponentProps, ReactNode } from 'react'

export interface LegacyProps extends ComponentProps<typeof Text> {
  children?: ReactNode
}

// Create linaria CSS classes for each style variant
const h1Style = css`
  font-size: ${TYPOGRAPHY.fontSizeH1};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight24};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize80};
    font-weight: ${TYPOGRAPHY.fontWeightBold};
    line-height: ${TYPOGRAPHY.lineHeight96};
  }
`

const h2Style = css`
  font-size: ${TYPOGRAPHY.fontSizeH2};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  line-height: ${TYPOGRAPHY.lineHeight20};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize38};
    line-height: ${TYPOGRAPHY.lineHeight48};
    font-weight: ${TYPOGRAPHY.fontWeightRegular};
  }
`

const h3Style = css`
  font-size: ${TYPOGRAPHY.fontSizeH3};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  line-height: ${TYPOGRAPHY.lineHeight20};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize32};
    line-height: ${TYPOGRAPHY.lineHeight42};
    font-weight: ${TYPOGRAPHY.fontWeightRegular};
  }
`

const h4Style = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize28};
    line-height: ${TYPOGRAPHY.lineHeight36};
    font-weight: ${TYPOGRAPHY.fontWeightRegular};
  }
`

const h6Style = css`
  font-size: ${TYPOGRAPHY.fontSizeH6};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  line-height: ${TYPOGRAPHY.lineHeight12};
  text-transform: ${TYPOGRAPHY.textTransformUppercase};
`

const pStyle = css`
  font-size: ${TYPOGRAPHY.fontSizeP};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  line-height: ${TYPOGRAPHY.lineHeight20};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize22};
    line-height: ${TYPOGRAPHY.lineHeight28};
    font-weight: ${TYPOGRAPHY.fontWeightRegular};
  }
`

const labelStyle = css`
  font-size: ${TYPOGRAPHY.fontSizeLabel};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  line-height: ${TYPOGRAPHY.lineHeight12};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize20};
    line-height: ${TYPOGRAPHY.lineHeight24};
    font-weight: ${TYPOGRAPHY.fontWeightRegular};
  }
`

const h2SemiBoldStyle = css`
  font-size: ${TYPOGRAPHY.fontSizeH2};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight20};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize38};
    line-height: ${TYPOGRAPHY.lineHeight48};
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  }
`

const h3SemiBoldStyle = css`
  font-size: ${TYPOGRAPHY.fontSizeH3};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight20};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize32};
    line-height: ${TYPOGRAPHY.lineHeight42};
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  }
`

const h4SemiBoldStyle = css`
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
`

const h6SemiBoldStyle = css`
  font-size: ${TYPOGRAPHY.fontSizeH6};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight12};
`

const pSemiBoldStyle = css`
  font-size: ${TYPOGRAPHY.fontSizeP};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight20};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize22};
    line-height: ${TYPOGRAPHY.lineHeight28};
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  }
`

const labelSemiBoldStyle = css`
  font-size: ${TYPOGRAPHY.fontSizeLabel};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight12};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize20};
    line-height: ${TYPOGRAPHY.lineHeight24};
  }
`

const h2BoldStyle = css`
  font-size: ${TYPOGRAPHY.fontSize38};
  line-height: ${TYPOGRAPHY.lineHeight48};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
`

const h3BoldStyle = css`
  font-size: ${TYPOGRAPHY.fontSize32};
  line-height: ${TYPOGRAPHY.lineHeight42};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
`

const h4BoldStyle = css`
  font-size: ${TYPOGRAPHY.fontSize28};
  line-height: ${TYPOGRAPHY.lineHeight36};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
`

const pBoldStyle = css`
  font-size: ${TYPOGRAPHY.fontSize22};
  line-height: ${TYPOGRAPHY.lineHeight28};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
`

const labelBoldStyle = css`
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  font-weight: ${TYPOGRAPHY.fontWeightBold};
`

const styleMap: { [tag: string]: string } = {
  h1: h1Style,
  h2: h2Style,
  h3: h3Style,
  h4: h4Style,
  h6: h6Style,
  p: pStyle,
  label: labelStyle,
  h2SemiBold: h2SemiBoldStyle,
  h3SemiBold: h3SemiBoldStyle,
  h4SemiBold: h4SemiBoldStyle,
  h6SemiBold: h6SemiBoldStyle,
  pSemiBold: pSemiBoldStyle,
  labelSemiBold: labelSemiBoldStyle,
  h2Bold: h2BoldStyle,
  h3Bold: h3BoldStyle,
  h4Bold: h4BoldStyle,
  pBold: pBoldStyle,
  labelBold: labelBoldStyle,
}

export const LegacyStyledText: React.FC<LegacyProps> = props => {
  const { fontWeight, as = 'p', className, ...otherProps } = props

  let fontWeightSuffix = ''
  if (fontWeight === TYPOGRAPHY.fontWeightSemiBold) {
    fontWeightSuffix = 'SemiBold'
  } else if (fontWeight === TYPOGRAPHY.fontWeightBold) {
    fontWeightSuffix = 'Bold'
  }

  const styleKey = `${as}${fontWeightSuffix}`
  const appliedStyle = styleMap[styleKey] || styleMap[as as string] || ''

  return (
    <Text
      {...otherProps}
      as={as}
      className={`${appliedStyle} ${className || ''}`.trim()}
    />
  )
}
