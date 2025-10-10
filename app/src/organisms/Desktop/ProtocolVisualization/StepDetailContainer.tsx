import { DestinationLabwareContainer } from './DestinationLabwareContainer'
import { DestinationTipsContainer } from './DestinationTipsContainer'
import { PipetteContainer } from './PipetteContainer'
import { SourceLabwareContainer } from './SourceLabwareContainer'
import { SourceWellViewContainer } from './SourceWellViewContainer'
import styles from './stepdetailcontainer.module.css'
import { TipPickupContainer } from './TipPickupContainer'

export function StepDetailContainer(): JSX.Element {
  return (
    <div className={styles.container}>
      <PipetteContainer mount="LEFT MOUNT" pipetteName="Flex 1-Channel 50 µL" />
      <TipPickupContainer />
      <SourceWellViewContainer />
      <SourceLabwareContainer />
      <DestinationLabwareContainer />
      <DestinationTipsContainer />
    </div>
  )
}
