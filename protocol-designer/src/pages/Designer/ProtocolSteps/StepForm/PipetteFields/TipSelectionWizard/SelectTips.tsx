import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { StyledText } from '@opentrons/components'

import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'

import { BaseDeckTipSelection } from './BaseDeckTipSelection'
import styles from './tipselectionwizard.module.css'
import { getViewboxFromSelectedLabware } from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type { DeckDefinition } from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms/types'

interface SelectTipsProps {
  selectedTiprackId: string | null
  setSelectedTiprackId: Dispatch<SetStateAction<string | null>>
  formTiprackUri: string
  activeDeckSetup: AllTemporalPropertiesForTimelineFrame
  deckDef: DeckDefinition
}

export function SelectTips(props: SelectTipsProps): JSX.Element {
  const { t } = useTranslation('tip_selection')
  const { selectedTiprackId, activeDeckSetup, deckDef } = props
  const labwareNicknamesById = useSelector(getLabwareNicknamesById)
  const labwareName = labwareNicknamesById[selectedTiprackId ?? '']
  const viewBox = getViewboxFromSelectedLabware(
    selectedTiprackId ?? '',
    activeDeckSetup,
    deckDef
  )

  if (viewBox == null) {
    console.warn(`no viewbox for selected tiprack ${selectedTiprackId}`)
  }

  // TODO: add controls for selecting tips
  const controls = <></>

  return (
    <div className={styles.modal_body}>
      <StyledText desktopStyle="headingSmallBold">
        {t('click_and_drag', { labwareName })}
      </StyledText>
      <BaseDeckTipSelection
        viewBox={viewBox}
        showSlotLabels={false}
        controls={controls}
      />
    </div>
  )
}
