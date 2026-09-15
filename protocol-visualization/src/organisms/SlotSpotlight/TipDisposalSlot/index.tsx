import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { RobotInfoLabel } from '@opentrons/components'

import styles from './tipdisposalslot.module.css'

import type { ReactNode } from 'react'
import type { RobotState } from '@opentrons/step-generation'

interface TipDisposalSlotProps {
  robotState: RobotState
  disposalType: 'trash' | 'wasteChute'
  // when set, the header block is rendered into this element via portal
  headerPortalEl?: HTMLElement | null
}

export function TipDisposalSlot({
  robotState,
  disposalType,
  headerPortalEl,
}: TipDisposalSlotProps): ReactNode {
  const { t } = useTranslation('protocol_visualization')
  // temporary commenting out for Rs 9.0.0
  // const totalEmptyTips = Object.values(tipState.tipracks).reduce(
  //   (sum, rack) =>
  //     sum +
  //     Object.values(rack).reduce(
  //       (rackSum, tipVal) => rackSum + (tipVal === EMPTY ? 1 : 0),
  //       0
  //     ),
  //   0
  // )
  const header = (
    <div className={styles.header}>
      <RobotInfoLabel
        deckLabel={disposalType === 'trash' ? t('trash') : t('waste_chute')}
      />
    </div>
  )

  return (
    <div className={styles.container}>
      {headerPortalEl != null ? createPortal(header, headerPortalEl) : header}
      <div className={styles.main_content}>
        {/* <div className={styles.text_container}>
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {disposalType === 'trash'
              ? t('tips_in_trash')
              : t('tips_in_waste_chute')}
          </StyledText>
          <StyledText desktopStyle="captionRegular">
            {t('remaining_tips', { remaining: totalEmptyTips })}
          </StyledText>
        </div> */}
        {/* Note this is for phase-2
          <div className={styles.text_container}>
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {t('lids_in_trash')}
          </StyledText>
          <StyledText desktopStyle="captionRegular">{'lids num'}</StyledText>
        </div> */}
      </div>
    </div>
  )
}
