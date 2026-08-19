import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { StyledText } from '@opentrons/components'
import {
  getAddressableAreaFromSlotId,
  getPositionFromSlotId,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { LabwareLabel } from '/protocol-designer/pages/Designer/LabwareLabel'
import { getInvariantContext } from '/protocol-designer/step-forms/selectors'

import { BaseDeckTipSelection } from './BaseDeckTipSelection'
import { TiprackSelectHover } from './TiprackSelectHover'
import styles from './tipselectionwizard.module.css'
import { getIsTiprackSelectable } from './utils'

import type { TipSelectionBaseProps } from './types'

export function SelectTiprack(props: TipSelectionBaseProps): JSX.Element {
  const {
    selectedTiprackId,
    setSelectedTiprackId,
    formTiprackUri,
    activeDeckSetup,
    deckDef,
    pipetteSpecs,
    nozzles,
  } = props
  const { t } = useTranslation('tip_selection')
  const { labware: allLabware } = activeDeckSetup
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { labwareEntities } = useSelector(getInvariantContext)

  const controls = (
    <>
      {Object.values(allLabware).map(labware => {
        const { id, def, stack } = labware
        if (
          getSlotInLocationStack(stack) === 'offDeck' ||
          stack.includes('fixedTrash')
        ) {
          return null
        }
        const slot = getSlotInLocationStack(stack)

        const slotPosition = getPositionFromSlotId(slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(
          slot,
          deckDef
        )?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          console.warn(`no slot ${slot} for labware ${id}!`)
          return null
        }
        const isTiprackSelectable = getIsTiprackSelectable({
          labware,
          formTiprackUri,
          pipetteSpecs,
          nozzles,
          labwareEntities,
          labwareRobotState: activeDeckSetup.labware,
        })

        return isTiprackSelectable ? (
          <>
            {id === selectedTiprackId ? (
              <LabwareLabel
                isSelected
                isLast={true}
                position={slotPosition}
                showModuleIcon={false}
                labwareDef={def}
                labelText={t('selected')}
              />
            ) : null}
            <TiprackSelectHover
              labware={labware}
              setHover={setHoveredId}
              slotPosition={slotPosition}
              onClick={() => {
                setSelectedTiprackId(id)
              }}
            />
          </>
        ) : null
      })}
    </>
  )

  return (
    <div className={styles.modal_body}>
      <StyledText desktopStyle="headingSmallBold">
        {t('select_tiprack')}
      </StyledText>
      <div className={styles.select_tips_deck_container}>
        <BaseDeckTipSelection hoveredId={hoveredId} controls={controls} />
      </div>
    </div>
  )
}
