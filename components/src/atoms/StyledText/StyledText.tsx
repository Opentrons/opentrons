import clsx from 'clsx'

import styles from './styledText.module.css'

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

export const helixProductStyleMap = {
  displayBold: { className: 'displayBold', as: 'h1' },
  headingLargeRegular: { className: 'headingLargeRegular', as: 'h2' },
  headingLargeBold: { className: 'headingLargeBold', as: 'h2' },
  headingMediumBold: { className: 'headingMediumBold', as: 'h3' },
  headingMediumSemiBold: { className: 'headingMediumSemiBold', as: 'h3' },
  headingSmallRegular: { className: 'headingSmallRegular', as: 'h4' },
  headingSmallBold: { className: 'headingSmallBold', as: 'h4' },
  headingSmallSemiBold: { className: 'headingSmallSemiBold', as: 'h4' },
  bodyLargeSemiBold: { className: 'bodyLargeSemiBold', as: 'p' },
  bodyLargeRegular: { className: 'bodyLargeRegular', as: 'p' },
  bodyDefaultSemiBold: { className: 'bodyDefaultSemiBold', as: 'p' },
  bodyDefaultRegular: { className: 'bodyDefaultRegular', as: 'p' },
  bodyDefaultRegLink: { className: 'bodyDefaultRegLink', as: 'p' },
  captionSemiBold: { className: 'captionSemiBold', as: 'label' },
  captionBold: { className: 'captionBold', as: 'label' },
  captionRegular: { className: 'captionRegular', as: 'label' },
  codeRegular: { className: 'codeRegular', as: 'p' },
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

export type StyledTextProps<T extends ElementType> = {
  children?: ReactNode
  as?: T
  desktopStyle?: HelixStyles
  oddStyle?: ODDStyles
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as'>

export function StyledText<T extends ElementType = 'p'>(
  props: StyledTextProps<T>
): JSX.Element {
  const { as, desktopStyle, oddStyle, className, children, ...rest } = props
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
    <Component className={combinedClassName} {...rest}>
      {children}
    </Component>
  )
}
