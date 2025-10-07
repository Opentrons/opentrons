import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'
import {
  getAddressableAreaFromSlotId,
  getPositionFromSlotId,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { LabwareLabel } from '/protocol-designer/pages/Designer/LabwareLabel'

import { BaseDeckTipSelection } from './BaseDeckTipSelection'
import { TiprackSelectHover } from './TiprackSelectHover'
import styles from './tipselectionwizard.module.css'
import { getIsTiprackSelectable } from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type { DeckDefinition } from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms/types'

interface SelectTiprackProps {
  selectedTiprackId: string | null
  setSelectedTiprackId: Dispatch<SetStateAction<string | null>>
  formTiprackUri: string
  activeDeckSetup: AllTemporalPropertiesForTimelineFrame
  deckDef: DeckDefinition
}

export function SelectTiprack(props: SelectTiprackProps): JSX.Element {
  const {
    selectedTiprackId,
    setSelectedTiprackId,
    formTiprackUri,
    activeDeckSetup,
    deckDef,
  } = props
  const { t } = useTranslation('tip_selection')
  const { labware: allLabware } = activeDeckSetup
  const [hover, setHover] = useState<string | null>(null)
  const controls = (
    <>
      {Object.values(allLabware).map(labware => {
        if (
          getSlotInLocationStack(labware.stack) === 'offDeck' ||
          labware.stack.includes('fixedTrash')
        ) {
          return null
        }
        const slot = getSlotInLocationStack(labware.stack)

        const slotPosition = getPositionFromSlotId(slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(slot, deckDef)
          ?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          console.warn(`no slot ${slot} for labware ${labware.id}!`)
          return null
        }
        const isTiprackSelectable = getIsTiprackSelectable(
          labware,
          formTiprackUri
        )
        return isTiprackSelectable ? (
          <>
            {labware.id === selectedTiprackId ? (
              <LabwareLabel
                isSelected
                isLast={true}
                position={slotPosition}
                showModuleIcon={false}
                labwareDef={labware.def}
                labelText={t('selected')}
              />
            ) : null}
            <TiprackSelectHover
              labware={labware}
              setHover={setHover}
              slotPosition={slotPosition}
              onClick={() => {
                setSelectedTiprackId(labware.id)
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
      <BaseDeckTipSelection hover={hover} controls={controls} />
    </div>
  )
}
