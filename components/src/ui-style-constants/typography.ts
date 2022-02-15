import { css } from 'styled-components'
// import type { FlattenSimpleInterpolation } from 'styled-components'

// Font Sizes
export const fontSizeH1 = '1.125rem' // 18px
export const fontSizeH2 = '0.9375rem' // 15px
export const fontSizeH3 = '0.875rem' // 14px
export const fontSizeH4 = '0.813rem' //  13px
export const fontSizeH6 = '0.625rem' // 10px
export const fontSizeP = '0.6875rem' // 11px
export const fontSizeLabel = '0.75rem' // 12px
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

//  Overflow menu constants
export const borderRadiusS = '4px 4px 0px 0px'
export const boxShadowS = '0px 1px 3px rgba(0, 0, 0, 0.2)'

//  Slideout constants
export const boxShadowM = '0px 3px 6px rgba(0, 0, 0, 0.23)'

//  Overflow menu btn width
export const overflowMenuWidth = '9.562rem'

//  Banner component styling
export const bannerButtonTopMargin = '2.75rem'

//  Heater Shaker Wizard styling
export const introMarginLeft = '6.063rem' //  97px
export const introImageWidth = '6.25rem' // 100px
export const introImageHeight = '4.313rem' // 69px
export const introBoxWidth = '344px'

// Default font styles, color agnositic for first pass
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
`

export const pRegular = css`
  font-size: ${fontSizeP};
  font-weight: ${fontWeightRegular};
  line-height: ${lineHeight12};
`

export const pSemiBold = css`
  font-size: ${fontSizeP};
  font-weight: ${fontWeightSemiBold};
  line-height: ${lineHeight12};
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
