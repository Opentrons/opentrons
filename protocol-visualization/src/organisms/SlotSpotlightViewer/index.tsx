import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ModelessModal } from '@opentrons/components'

import { SlotDetails } from '../SlotDetails'
import styles from './slotspotlightviewer.module.css'

import type { ReactNode } from 'react'
import type { Liquid, ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'
import type { AppType } from '../../types'

// Note: use the desktop app's sizes
const DEFAULT_WIDTH_PX = 500
const DEFAULT_HEIGHT_PX = 464

const HEADER_ID = 'slot-spotlight-header'

interface SlotSpotlightViewerProps {
  appType: AppType
  slotId: string
  robotState: RobotState
  invariantContext: InvariantContext
  analysis: ProtocolAnalysisOutput
  liquids: Liquid[]
  onClose: () => void
}

export function SlotSpotlightViewer(
  props: SlotSpotlightViewerProps
): ReactNode | null {
  const {
    appType,
    slotId,
    robotState,
    invariantContext,
    analysis,
    liquids,
    onClose,
  } = props
  const { t } = useTranslation('protocol_visualization')
  // the slot content renders its own header block into this element via portal
  const [headerEl, setHeaderEl] = useState<HTMLDivElement | null>(null)

  if (appType === 'desktop') {
    return null
  }

  return (
    <ModelessModal
      header={
        <div ref={setHeaderEl} className={styles.header} id={HEADER_ID} />
      }
      aria-labelledby={HEADER_ID}
      aria-label={t('close_slot_spotlight')}
      onClose={onClose}
      defaultWidth={DEFAULT_WIDTH_PX}
      defaultHeight={DEFAULT_HEIGHT_PX}
    >
      <SlotDetails
        slotId={slotId}
        robotState={robotState}
        invariantContext={invariantContext}
        analysis={analysis}
        liquids={liquids}
        headerPortalEl={headerEl}
      />
    </ModelessModal>
  )
}
