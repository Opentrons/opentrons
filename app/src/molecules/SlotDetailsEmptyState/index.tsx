import { useTranslation } from 'react-i18next'

import { COLORS, RobotInfoLabel, StyledText } from '@opentrons/components'

import styles from './slotdetailsemptystate.module.css'

interface SlotDetailsEmptyStateProps {
  slotId: string
}

export function SlotDetailsEmptyState(
  props: SlotDetailsEmptyStateProps
): JSX.Element {
  const { slotId } = props
  const { t } = useTranslation('protocol_visualization')
  return (
    <div className={styles.slot_empty_container}>
      <div className={styles.slot_empty_header}>
        <RobotInfoLabel deckLabel={slotId} />
      </div>
      <div className={styles.slot_empty_body}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey50}>
          {t('slot_empty')}
        </StyledText>
      </div>
    </div>
  )
}
