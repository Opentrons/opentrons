import { Divider, StyledText } from '@opentrons/components'

import styles from './preview.module.css'

import type { TrashBinEntities } from '@opentrons/step-generation'

interface TrashSlotDetailsProps {
  trashBinEntities: TrashBinEntities
}

export function TrashSlotDetails(props: TrashSlotDetailsProps): JSX.Element {
  const { trashBinEntities } = props

  const header =
    Object.values(trashBinEntities).length > 0 ? 'Trash bin' : 'Waste Chute'

  return (
    <>
      <div className={styles.detailContainer}>
        <div className={styles.slotDetailsActiveStep}>
          <StyledText desktopStyle="bodyDefaultSemiBold">{header}</StyledText>
        </div>
      </div>
      <Divider />
    </>
  )
}
