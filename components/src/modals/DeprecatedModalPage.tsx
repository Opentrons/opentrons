// titled modal page component
import * as React from 'react'
import cx from 'classnames'

import { Box } from '../primitives'
import { DeprecatedTitleBar } from '../structure'
import { Overlay } from './Overlay'
import styles from './modals.css'

import type { DeprecatedTitleBarProps } from '../structure'

export interface DeprecatedModalPageProps {
  /** Props for title bar at top of modal page */
  titleBar: DeprecatedTitleBarProps
  contentsClassName?: string
  heading?: React.ReactNode
  children?: React.ReactNode
  innerProps?: React.ComponentProps<typeof Box>
  outerProps?: React.ComponentProps<typeof Box>
}

export function DeprecatedModalPage(
  props: DeprecatedModalPageProps
): JSX.Element {
  const { titleBar, heading, innerProps = {}, outerProps = {} } = props

  return (
    <Box className={styles.modal_page} {...outerProps}>
      <Overlay />
      <DeprecatedTitleBar {...titleBar} className={styles.title_bar} />
      <Box
        className={cx(styles.modal_page_contents, props.contentsClassName)}
        {...innerProps}
      >
        {heading && <h3 className={styles.modal_heading}>{heading}</h3>}
        {props.children}
      </Box>
    </Box>
  )
}
