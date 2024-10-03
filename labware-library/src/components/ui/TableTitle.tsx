// Table Title with expandable measurement diagrams
import cx from 'classnames'
import { LabelText, LABEL_LEFT } from './LabelText'
// import { ClickableIcon } from './ClickableIcon'
import styles from './styles.module.css'

interface TableTitleProps {
  label: React.ReactNode
  diagram?: React.ReactNode
}

export function TableTitle(props: TableTitleProps): JSX.Element {
  // TODO(ja, 9/30/24): fix the actual bug. temporarily commenting it out for now since the images
  //  rendered by the toggleGuide were not being copied into the build folder
  //  see https://opentrons.atlassian.net/browse/AUTH-885 for more info
  // const [guideVisible, setGuideVisible] = React.useState<boolean>(false)
  // const toggleGuide = (): void => {
  //   setGuideVisible(!guideVisible)
  // }
  //   const iconClassName = cx(styles.info_button, {
  //   [styles.active]: guideVisible,
  // })
  const { label, diagram } = props

  const contentClassName = cx(styles.expandable_content, {
    [styles.open]: false,
  })

  return (
    <>
      <div className={styles.table_title}>
        <LabelText position={LABEL_LEFT}>{label}</LabelText>
        {/* <ClickableIcon
          title="info"
          name="information"
          className={iconClassName}
          onClick={toggleGuide}
        /> */}
      </div>
      <div className={contentClassName}>{diagram}</div>
    </>
  )
}
