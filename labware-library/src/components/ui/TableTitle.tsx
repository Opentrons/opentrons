// Table Title with expandable measurement diagrams
import * as React from 'react'
import cx from 'classnames'
import { LabelText, LABEL_LEFT } from './LabelText'
import { ClickableIcon } from './ClickableIcon'
import styles from './styles.module.css'

interface TableTitleProps {
  label: React.ReactNode
  diagram?: React.ReactNode
}

export function TableTitle(props: TableTitleProps): JSX.Element {
  const [guideVisible, setGuideVisible] = React.useState<boolean>(false)
  const toggleGuide = (): void => setGuideVisible(!guideVisible)
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
