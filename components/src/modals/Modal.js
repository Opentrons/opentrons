// @flow
import * as React from 'react'
import cx from 'classnames'
import { RemoveScroll } from 'react-remove-scroll'

import { Overlay } from './Overlay'
import styles from './modals.css'

export type ModalProps = {|
  /** handler to close the modal (attached to `Overlay` onClick) */
  onCloseClick?: (event: SyntheticEvent<>) => mixed,
  /** Optional styled heading **/
  heading?: string,
  /** modal contents */
  children: React.Node,
  /** classes to apply */
  className?: string,
  /** classes to apply to the contents box */
  contentsClassName?: string,
  /** lightens overlay (alert modal over existing modal) */
  alertOverlay?: boolean,
  /** restricts scroll outside of Modal when open, true by default */
  restrictOuterScroll?: boolean,
  innerRef?:
    | {| current: HTMLElement | null |}
    | ((current: HTMLElement | null) => mixed),
|}

/**
 * Base modal component that fills its nearest `display:relative` ancestor
 * with a dark overlay and displays `children` as its contents in a white box
 */
export function Modal(props: ModalProps): React.Node {
  const {
    contentsClassName,
    alertOverlay,
    onCloseClick,
    heading,
    innerRef,
    restrictOuterScroll = true,
  } = props
  const Wrapper = restrictOuterScroll ? RemoveScroll : React.Fragment
  return (
    <Wrapper>
      <div
        className={cx(styles.modal, props.className, {
          [styles.alert_modal]: alertOverlay,
        })}
      >
        <Overlay onClick={onCloseClick} alertOverlay={alertOverlay} />
        <div
          ref={innerRef}
          className={cx(styles.modal_contents, contentsClassName)}
        >
          {heading && <h3 className={styles.modal_heading}>{heading}</h3>}
          {props.children}
        </div>
      </div>
    </Wrapper>
  )
}
