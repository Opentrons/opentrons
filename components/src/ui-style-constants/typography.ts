import { css } from 'styled-components'
import { COLORS } from './'

// Font Sizes
export const fontSize80 = '5rem' // 80px
export const fontSize38 = '2.375rem' // 38px
export const fontSize32 = '2rem' // 32px
export const fontSize28 = '1.75rem' // 28px
export const fontSize22 = '1.375rem' // 22px
export const fontSize20 = '1.25rem' // 20px
export const fontSizeH1 = '1.188rem' // 19px
export const fontSizeH2 = '0.9375rem' // 15px
export const fontSizeH3 = '0.875rem' // 14px
export const fontSizeH4 = '0.813rem' //  13px
export const fontSizeH6 = '0.563rem' // 9px
export const fontSizeP = '0.8125rem' // 13px
export const fontSizeLabel = '0.6875rem' // 11px
// this is redundant but we need this for captions and it makes more sense to call it caption rather than re-using fsh6
export const fontSizeCaption = '0.625rem' // 10px

// Font Weights
export const fontWeightBold = 700
export const fontWeightSemiBold = 600
export const fontWeightRegular = 400
export const fontWeightLight = 300

// Line Heights
export const lineHeight96 = '6rem' // 96px
export const lineHeight48 = '3rem' // 48px
export const lineHeight42 = '2.625rem' // 42px
export const lineHeight36 = '2.25rem' // 36px
export const lineHeight28 = '1.75rem' // 28px
export const lineHeight24 = '1.5rem' // 24px
export const lineHeight20 = '1.25rem' // 20px
export const lineHeight18 = '1.125rem' // 18px
export const lineHeight16 = '1rem' // 16px
export const lineHeight12 = '0.75rem' // 12px

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
  font-size: ${fontSizeH1};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight24};
`

export const h2Regular = css`
  font-size: ${fontSizeH2};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight20};
`

export const h2SemiBold = css`
  font-size: ${fontSizeH2};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight20};
`
export const h3Regular = css`
  font-size: ${fontSizeH3};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight20};
`

export const h3SemiBold = css`
  font-size: ${fontSizeH3};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight20};
`

export const h6Default = css`
  font-size: ${fontSizeH6};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight12};
  text-transform: ${textTransformUppercase};
`

export const h6SemiBold = css`
  font-size: ${fontSizeH6};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight12};
`

export const pRegular = css`
  font-size: ${fontSizeP};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight20};
`

export const pSemiBold = css`
  font-size: ${fontSizeP};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight20};
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

export const linkPSemiBold = css`
  font-size: ${fontSizeP};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight20};
  color: ${COLORS.blueEnabled};

  &:hover {
    opacity: 70%;
  }
`

// font styles for touchscreen
export const level1Header = css`
  font-size: ${fontSize80};
  font-weight: ${fontWeightBold};
  line-height: ${lineHeight96};
`

export const level2HeaderBold = css`
  font-size: ${fontSize38};
  line-height: ${lineHeight48};
  font-weight: ${fontWeightBold};
`

export const level2HeaderSemiBold = css`
  font-size: ${fontSize38};
  line-height: ${lineHeight48};
  font-weight: ${fontWeightSemiBold};
`

export const level2HeaderRegular = css`
  font-size: ${fontSize38};
  line-height: ${lineHeight48};
  font-weight: ${fontWeightRegular};
`

export const level3HeaderBold = css`
  font-size: ${fontSize32};
  line-height: ${lineHeight42};
  font-weight: ${fontWeightBold};
`

export const level3HeaderSemiBold = css`
  font-size: ${fontSize32};
  line-height: ${lineHeight42};
  font-weight: ${fontWeightSemiBold};
`

export const level3HeaderRegular = css`
  font-size: ${fontSize32};
  line-height: ${lineHeight42};
  font-weight: ${fontWeightRegular};
`

export const level4HeaderBold = css`
  font-size: ${fontSize28};
  line-height: ${lineHeight36};
  font-weight: ${fontWeightBold};
`

export const level4HeaderSemiBold = css`
  font-size: ${fontSize28};
  line-height: ${lineHeight36};
  font-weight: ${fontWeightSemiBold};
`

export const level4HeaderRegular = css`
  font-size: ${fontSize28};
  line-height: ${lineHeight36};
  font-weight: ${fontWeightRegular};
`

export const bodyTextBold = css`
  font-size: ${fontSize22};
  line-height: ${lineHeight28};
  font-weight: ${fontWeightBold};
`

export const bodyTextSemiBold = css`
  font-size: ${fontSize22};
  line-height: ${lineHeight28};
  font-weight: ${fontWeightSemiBold};
`

export const bodyTextRegular = css`
  font-size: ${fontSize22};
  line-height: ${lineHeight28};
  font-weight: ${fontWeightRegular};
`

export const smallBodyTextBold = css`
  font-size: ${fontSize20};
  line-height: ${lineHeight24};
  font-weight: ${fontWeightBold};
`

export const smallBodyTextSemiBold = css`
  font-size: ${fontSize20};
  line-height: ${lineHeight24};
  font-weight: ${fontWeightSemiBold};
`

export const smallBodyTextRegular = css`
  font-size: ${fontSize20};
  line-height: ${lineHeight24};
  font-weight: ${fontWeightRegular};
`

export const darkLinkH4SemiBold = css`
  font-size: ${fontSizeH4};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight20};
  color: ${COLORS.darkGreyEnabled};
  &:hover {
    color: ${COLORS.darkBlackEnabled};
  }
`

export const darkLinkLabelSemiBold = css`
  font-size: ${fontSizeLabel};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight20};
  color: ${COLORS.darkGreyEnabled};
  &:hover {
    color: ${COLORS.darkBlackEnabled};
  }
`

export const darkLinkLabelSemiBoldDisabled = css`
  font-size: ${fontSizeLabel};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight20};
  color: ${COLORS.medGreyHover};
  cursor: not-allowed;
`
