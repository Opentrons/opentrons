// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

type Props = {|
  /** Title for the card */
  title: string,
  /** Card Content, each child will be separated with a grey bottom border */
  children: ?React.Node,
  /** Optional className for card contents */
  className?: string,
  initiallyExpanded: boolean,
|}

export default function StatusCard(props: Props) {
  const [isCollapsed, setIsCollapsed] = React.useState(!props.initiallyExpanded)

  return (
    <div
      className={styles.status_card}
      onClick={() => setIsCollapsed(!isCollapsed)}
    >
      <h3 className={styles.card_title}>{props.title}</h3>
      {!isCollapsed && (
        <div className={cx(styles.card_contents, props.className)}>
          {props.children}
        </div>
      )}
    </div>
  )
}
