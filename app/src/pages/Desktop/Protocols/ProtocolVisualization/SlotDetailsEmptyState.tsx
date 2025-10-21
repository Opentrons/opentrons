import { COLORS, StyledText } from '@opentrons/components'

import styles from './preview.module.css'

export function SlotDetailsEmptyState(): JSX.Element {
  return (
    <div>
      <div className={styles.slot_details_active_step}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          Empty
        </StyledText>
      </div>
      <div className={styles.empty_state_box_container}>
        <div className={styles.empty_state_box} />
      </div>
    </div>
  )
}
