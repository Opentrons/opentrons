import { css } from 'styled-components'
import { COLORS } from './'

// Font Sizes
export const fontSizeH1 = '1.125rem' // 18px
export const fontSizeH2 = '0.9375rem' // 15px
export const fontSizeH3 = '0.875rem' // 14px
export const fontSizeH4 = '0.813rem' //  13px
export const fontSizeH6 = '0.563rem' // 9px
export const fontSizeP = '0.6875rem' // 11px
export const fontSizeLabel = '0.625rem' // 10px
// this is redundant but we need this for captions and it makes more sense to call it caption rather than re-using fsh6
export const fontSizeCaption = '0.625rem' // 10px

// Font Weights
export const fontWeightBold = 800
export const fontWeightSemiBold = 600
export const fontWeightRegular = 400
export const fontWeightLight = 300

// Line Heights
export const lineHeight24 = '1.5rem' // 24px
export const lineHeight20 = '1.25rem' // 20px
export const lineHeight16 = '1rem' // 16px
export const lineHeight12 = '.75rem' // 12px
export const lineHeight18 = '1.125rem' // 18px

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

// Default font styles, color agnositic for first pass
export const h1Default = css`
  font-size: ${fontSizeH1};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight24};
  color: ${COLORS.darkBlack};
`

export const h2Regular = css`
  font-size: ${fontSizeH2};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight20};
  color: ${COLORS.darkBlack};
`

export const h2SemiBold = css`
  font-size: ${fontSizeH2};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight20};
  color: ${COLORS.darkBlack};
`
export const h3Regular = css`
  font-size: ${fontSizeH3};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight20};
  color: ${COLORS.darkBlack};
`

export const h3SemiBold = css`
  font-size: ${fontSizeH3};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight20};
  color: ${COLORS.darkBlack};
`

export const h6Default = css`
  font-size: ${fontSizeH6};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight12};
  text-transform: ${textTransformUppercase};
  color: ${COLORS.darkBlack};
`

export const h6SemiBold = css`
  font-size: ${fontSizeH6};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight12};
  color: ${COLORS.darkBlack};
`

export const pRegular = css`
  font-size: ${fontSizeP};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight16};
  color: ${COLORS.darkBlack};
`

export const pSemiBold = css`
  font-size: ${fontSizeP};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight16};
  color: ${COLORS.darkBlack};
`

export const labelRegular = css`
  font-size: ${fontSizeLabel};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight12};
`

export const labelSemiBold = css`
  font-size: ${fontSizeLabel};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight12};
`

export const linkPSemibold = css`
  font-size: ${fontSizeP};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight16};
  color: ${COLORS.blue};

  &:hover {
    opacity: 70%;
  }
`
