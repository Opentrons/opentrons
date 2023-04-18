import { css } from 'styled-components'
import { COLORS } from './colors'

// Font Sizes
export const fontSize19 = '1.188rem' // 19px
export const fontSize16 = '1rem' // 16px
export const fontSize14 = '0.875rem' // 14px
export const fontSize13 = '0.813rem' //  13px
export const fontSize10 = '0.625rem' // 10px

// Font Weights
export const fontWeightLevel2Bold = 700
export const fontWeightRegular = 400

// Line Heights
export const lineHeight16 = '1rem' // 16px

// font styles
export const fontStyleNormal = 'normal'
export const fontStyleItalic = 'italic'

// text transforms
export const textTransformNone = 'none'
export const textTransformCapitalize = 'capitalize'
export const textTransformUppercase = 'uppercase'
export const textTransformLowercase = 'lowercase'

export const textAlignLeft = 'left'
export const textAlignRight = 'right'
export const textAlignCenter = 'center'
export const textAlignJustify = 'justify'

// text decoration
export const textDecorationUnderline = 'underline'

// Default font styles, color agnostic for first pass
export const h1Default = css`
  font-size: ${fontSize19};
  font-weight: ${fontWeightLevel2Bold};
  line-height: ${lineHeight16};
`

export const h2SemiBold = css`
  font-size: ${fontSize16};
  font-weight: ${fontWeightLevel2Bold};
  line-height: ${lineHeight16};
`
export const h4Regular = css`
  font-size: ${fontSize14};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight16};
`

export const h3SemiBold = css`
  font-size: ${fontSize14};
  font-weight: ${fontWeightLevel2Bold};
  line-height: ${lineHeight16};
`

export const h5Default = css`
  font-size: ${fontSize13};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight16};
`

export const pRegular = css`
  font-size: ${fontSize10};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight16};
`

export const labelItalic = css`
  font-size: ${fontSize10};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight16};
  font-style: ${fontStyleItalic};
`

export const linkPSemiBold = css`
  font-size: ${fontSize10};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight16};
  color: ${COLORS.blueLink};

  &:hover {
    opacity: 70%;
  }
`

export const TYPOGRAPHY = {
  fontSize19,
  fontSize16,
  fontSize14,
  fontSize13,
  fontSize10,
  fontWeightLevel2Bold,
  fontWeightRegular,
  lineHeight16,
  fontStyleNormal,
  fontStyleItalic,
  textTransformNone,
  textTransformCapitalize,
  textTransformUppercase,
  textTransformLowercase,
  textAlignLeft,
  textAlignRight,
  textAlignCenter,
  textAlignJustify,
  textDecorationUnderline,
  h1Default,
  h2SemiBold,
  h4Regular,
  h3SemiBold,
  h5Default,
  pRegular,
  labelItalic,
  linkPSemiBold,
}
