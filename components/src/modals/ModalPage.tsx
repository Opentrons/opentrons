// titled modal page component
import { Box } from '../primitives'
import { TitleBar } from '../structure'
import type { TitleBarProps } from '../structure'
import { Overlay } from './Overlay'
import styles from './modals.css'
import cx from 'classnames'
import * as React from 'react'

export interface ModalPageProps {
  /** Props for title bar at top of modal page */
  titleBar: TitleBarProps
  contentsClassName?: string
  heading?: React.ReactNode
  children?: React.ReactNode
  innerProps?: React.ComponentProps<typeof Box>
  outerProps?: React.ComponentProps<typeof Box>
}

/**
 * @deprecated Use `Interstitial` instead
 */

export function ModalPage(props: ModalPageProps): JSX.Element {
  const { titleBar, heading, innerProps = {}, outerProps = {} } = props

  return (
    <Box className={styles.modal_page} {...outerProps}>
      <Overlay />
      <TitleBar {...titleBar} className={styles.title_bar} />
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
