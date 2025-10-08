import styles from './labwareinfocontainer.module.css'
import { PipetteContainer } from './PipetteContainer'

export function LabwareInfoContainer(): JSX.Element {
  return (
    <div className={styles.container}>
      <PipetteContainer mount="LEFT MOUNT" pipetteName="Flex 1-Channel 50 µL" />
    </div>
  )
}
