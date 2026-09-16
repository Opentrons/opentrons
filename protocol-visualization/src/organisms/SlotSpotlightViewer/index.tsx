import { useTranslation } from 'react-i18next'

import {
  ModelessModal,
  RobotInfoLabel,
  StyledText,
} from '@opentrons/components'
import {
  FAKE_HOPPER_LOCATION_MAP,
  HOPPER_FAKE_LOCATIONS,
} from '@opentrons/step-generation'

import { SlotDetails } from '../SlotDetails'
import styles from './slotspotlightviewer.module.css'

import type { ReactNode } from 'react'
import type { Liquid, ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type {
  HopperLocationMapKey,
  InvariantContext,
  RobotState,
} from '@opentrons/step-generation'
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

  if (appType === 'desktop') {
    return null
  }

  let deckLabel = slotId
  if (HOPPER_FAKE_LOCATIONS.includes(slotId)) {
    deckLabel = FAKE_HOPPER_LOCATION_MAP[slotId as HopperLocationMapKey]
  }

  return (
    <ModelessModal
      header={
        <div className={styles.header} id={HEADER_ID}>
          <RobotInfoLabel deckLabel={deckLabel} />
          <StyledText desktopStyle="bodyLargeSemiBold">
            {t('slot_spotlight')}
          </StyledText>
        </div>
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
      />
    </ModelessModal>
  )
}
