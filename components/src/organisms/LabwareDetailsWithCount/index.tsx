import { StyledText, Tag } from '../../atoms'
import styles from './LabwareDetailsWithCount.module.css'

type LabwareDetailsWithCountProps = {
  title: string
  subTitle?: string
  label?: string
}

export function LabwareDetailsWithCount({
  title,
  subTitle,
  label,
}: LabwareDetailsWithCountProps): JSX.Element {
  return (
    <div className={styles.container}>
      <StyledText desktopStyle="bodyDefaultRegular">{title}</StyledText>
      <div className={styles.subTitle}>
        <StyledText desktopStyle="bodyDefaultRegular">{subTitle}</StyledText>
      </div>
      {label != null ? (
        <div className={styles.label}>
          <Tag type="default" text={label} />
        </div>
      ) : null}
    </div>
  )
}
