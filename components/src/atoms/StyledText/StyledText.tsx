import clsx from 'clsx'

import { TYPOGRAPHY as HELIX_TYPOGRAPHY } from '../../helix-design-system/product'
import { Text } from '../../primitives'
import { RESPONSIVENESS, TYPOGRAPHY } from '../../ui-style-constants'
import styles from './styledText.module.css'

import type { ComponentPropsWithoutRef, ElementType, FC } from 'react'

// const helixProductStyleMap = {
//   displayBold: {
//     as: 'h1',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${TYPOGRAPHY.fontStyleDisplayBold};
//       }
//     `,
//   },
//   headingLargeRegular: {
//     as: 'h2',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleHeadingLargeRegular};
//       }
//     `,
//   },
//   headingLargeBold: {
//     as: 'h2',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleHeadingLargeBold};
//       }
//     `,
//   },
//   headingMediumBold: {
//     as: 'h3',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleHeadingMediumBold};
//       }
//     `,
//   },
//   headingMediumSemiBold: {
//     as: 'h3',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleHeadingMediumSemiBold};
//       }
//     `,
//   },
//   headingSmallRegular: {
//     as: 'h4',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleHeadingSmallRegular};
//       }
//     `,
//   },
//   headingSmallBold: {
//     as: 'h4',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleHeadingSmallBold};
//       }
//     `,
//   },
//   headingSmallSemiBold: {
//     as: 'h4',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleHeadingSmallBold};
//       }
//     `,
//   },
//   bodyLargeSemiBold: {
//     as: 'p',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleBodyLargeSemiBold};
//       }
//     `,
//   },
//   bodyLargeRegular: {
//     as: 'p',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleBodyLargeRegular};
//       }
//     `,
//   },
//   bodyDefaultSemiBold: {
//     as: 'p',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleBodyDefaultSemiBold};
//       }
//     `,
//   },
//   bodyDefaultRegular: {
//     as: 'p',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleBodyDefaultRegular};
//       }
//     `,
//   },
//   bodyDefaultRegLink: {
//     as: 'p',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleBodyDefaultRegular};
//         text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
//       }
//     `,
//   },
//   captionSemiBold: {
//     as: 'label',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleCaptionSemiBold};
//       }
//     `,
//   },
//   captionBold: {
//     as: 'label',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleCaptionBold};
//       }
//     `,
//   },
//   captionRegular: {
//     as: 'label',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleCaptionRegular};
//       }
//     `,
//   },
//   codeRegular: {
//     as: 'p',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         font: ${HELIX_TYPOGRAPHY.fontStyleCodeRegular};
//       }
//     `,
//   },
//   hidden: {
//     as: 'none',
//     style: css`
//       @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
//         display: none;
//       }
//     `,
//   },

export const helixProductStyleMap = {
  displayBold: { className: 'display_bold', as: 'h1' },
  headingLargeRegular: { className: 'heading_large_regular', as: 'h2' },
  headingLargeBold: { className: 'heading_large_bold', as: 'h2' },
  headingMediumBold: { className: 'heading_medium_bold', as: 'h3' },
  headingMediumSemiBold: { className: 'heading_medium_semiBold', as: 'h3' },
  headingSmallRegular: { className: 'heading_small_regular', as: 'h4' },
  headingSmallBold: { className: 'heading_small_bold', as: 'h4' },
  headingSmallSemiBold: { className: 'heading_small_semiBold', as: 'h4' },
  bodyLargeSemiBold: { className: 'body_large_semiBold', as: 'p' },
  bodyLargeRegular: { className: 'body_large_regular', as: 'p' },
  bodyDefaultSemiBold: { className: 'body_default_semiBold', as: 'p' },
  bodyDefaultRegular: { className: 'body_default_regular', as: 'p' },
  bodyDefaultRegLink: { className: 'body_default_reg_link', as: 'p' },
  captionSemiBold: { className: 'caption_semiBold', as: 'label' },
  captionBold: { className: 'caption_bold', as: 'label' },
  captionRegular: { className: 'caption_regular', as: 'label' },
  codeRegular: { className: 'code_regular', as: 'p' },
  hidden: { className: 'hidden', as: 'span' },
} as const

export const ODDStyleMap = {
  level1Header: { className: 'level_1_header', as: 'h1' },
  level2HeaderRegular: { className: 'level_2_header_regular', as: 'h2' },
  level2HeaderSemiBold: { className: 'level_2_header_semiBold', as: 'h2' },
  level2HeaderBold: { className: 'level_2_header_bold', as: 'h2' },
  level3HeaderRegular: { className: 'level_3_header_regular', as: 'h3' },
  level3HeaderSemiBold: { className: 'level_3_header_semiBold', as: 'h3' },
  level3HeaderBold: { className: 'level_3_header_bold', as: 'h3' },
  level4HeaderRegular: { className: 'level_4_header_regular', as: 'h4' },
  level4HeaderSemiBold: { className: 'level_4_header_semiBold', as: 'h4' },
  level4HeaderBold: { className: 'level_4_header_bold', as: 'h4' },
  bodyTextRegular: { className: 'body_text_regular', as: 'p' },
  bodyTextSemiBold: { className: 'body_text_semiBold', as: 'p' },
  bodyTextBold: { className: 'body_text_bold', as: 'p' },
  smallBodyTextRegular: { className: 'small_body_text_regular', as: 'label' },
  smallBodyTextSemiBold: { className: 'small_body_text_semiBold', as: 'label' },
  smallBodyTextBold: { className: 'small_body_text_bold', as: 'label' },
  hidden: { className: 'hidden_touchscreen', as: 'span' },
} as const

type HelixStyles = keyof typeof helixProductStyleMap
type ODDStyles = keyof typeof ODDStyleMap

type StyledTextProps<T extends ElementType> = {
  as?: T
  desktopStyle?: HelixStyles
  oddStyle?: ODDStyles
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as'>

export const StyledText: FC<StyledTextProps<'p'>> = ({
  as,
  desktopStyle,
  oddStyle,
  className,
  children,
  ...rest
}) => {
  const desktopDef = desktopStyle
    ? helixProductStyleMap[desktopStyle]
    : undefined
  const oddDef = oddStyle ? ODDStyleMap[oddStyle] : undefined

  const Component = as || desktopDef?.as || oddDef?.as || 'p'

  const combinedClassName = clsx(
    desktopDef ? styles[desktopDef.className] : null,
    oddDef ? styles[oddDef.className] : null,
    className
  )

  return (
    <Text as={Component} className={combinedClassName} {...rest}>
      {children}
    </Text>
  )
}
