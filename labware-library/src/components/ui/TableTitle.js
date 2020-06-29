// @flow

// Table Title with expandable measurement diagrams
import cx from 'classnames'
import * as React from 'react'

import { ClickableIcon } from './ClickableIcon'
import { LABEL_LEFT, LabelText } from './LabelText'
import styles from './styles.css'

type TableTitleProps = {|
  label: React.Node,
  diagram?: React.Node,
|}

export function TableTitle(props: TableTitleProps): React.Node {
  const [guideVisible, setGuideVisible] = React.useState<boolean>(false)
  const toggleGuide = () => setGuideVisible(!guideVisible)
  const { label, diagram } = props

  const iconClassName = cx(styles.info_button, {
    [styles.active]: guideVisible,
  })

  const contentClassName = cx(styles.expandable_content, {
    [styles.open]: guideVisible,
  })

  return (
    <>
      <div className={styles.table_title}>
        <LabelText position={LABEL_LEFT}>{label}</LabelText>
        <ClickableIcon
          title="info"
          name="information"
          className={iconClassName}
          onClick={toggleGuide}
        />
      </div>
      <div className={contentClassName}>{diagram}</div>
    </>
  )
}
