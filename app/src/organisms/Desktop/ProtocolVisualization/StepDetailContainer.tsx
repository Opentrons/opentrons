import { DestinationLabwareContainer } from './DestinationLabwareContainer'
import { DestinationTipsContainer } from './DestinationTipsContainer'
import { PipetteContainer } from './PipetteContainer'
import { SourceLabwareContainer } from './SourceLabwareContainer'
import { SourceWellViewContainer } from './SourceWellViewContainer'
import styles from './stepdetailcontainer.module.css'
import { TipPickupContainer } from './TipPickupContainer'

interface StepDetailContainerProps {
  protocolKey: string
}

export function StepDetailContainer({
  protocolKey,
}: StepDetailContainerProps): JSX.Element {
  return (
    <div className={styles.container}>
      <PipetteContainer mount="LEFT MOUNT" pipetteName="Flex 1-Channel 50 µL" />
      <TipPickupContainer protocolKey={protocolKey} />
      <SourceWellViewContainer />
      <SourceLabwareContainer />
      <DestinationLabwareContainer />
      <DestinationTipsContainer />
    </div>
  )
}
