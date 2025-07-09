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
      <div className={styles.detail_container}>
        <div className={styles.slot_details_active_step}>
          <StyledText desktopStyle="bodyDefaultSemiBold">{header}</StyledText>
        </div>
      </div>
      <Divider />
    </>
  )
}
