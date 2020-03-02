// @flow
// Card component with drop shadow

import * as React from 'react'
import styled from 'styled-components'

import * as styles from '../styles'

export type CardProps = {|
  /** Title for card, all cards should receive a title. */
  title?: React.Node,
  /** Card contents */
  children?: React.Node,
  /** If card can not be used, gray it out and remove pointer events */
  disabled?: boolean,
  /** Additional class names */
  className?: string,
|}

/**
 * Renders a basic card element with a white background, dropshadow, and zero padding.
 *
 * Titles and other children handle their own styles and layout.
 */
export function Card(props: CardProps) {
  const { title, children, className, disabled } = props

  return (
    <Section disabled={disabled} className={className}>
      {title && <Title className={className}>{title}</Title>}
      {children}
    </Section>
  )
}

const Section = styled.section`
  ${styles.FS_BODY_2}
  position: relative;
  overflow: visible;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.33);

  ${({ disabled }) =>
    disabled &&
    `
    pointer-events: none;
    background-color: transparent;

    & * {
      color: ${styles.C_FONT_DISABLED};
      fill: ${styles.C_FONT_DISABLED};
      background-color: transparent;
    }
  `}
`

const Title = styled.h3`
  ${styles.FONT_HEADER_DARK}
  ${styles.FW_REGULAR}

  margin: 0;
  padding: ${styles.S_1} ${styles.S_1} 0;
  text-transform: capitalize;
`
