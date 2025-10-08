import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { StyledText } from '@opentrons/components'

import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'

import { BaseDeckTipSelection } from './BaseDeckTipSelection'
import styles from './tipselectionwizard.module.css'
import { getViewboxFromSelectedLabware } from './utils'

import type { TipSelectionBaseProps } from './types'

export function SelectTips(props: TipSelectionBaseProps): JSX.Element {
  const { t } = useTranslation('tip_selection')
  const { selectedTiprackId, activeDeckSetup, deckDef } = props
  const labwareNicknamesById = useSelector(getLabwareNicknamesById)
  const labwareName = labwareNicknamesById[selectedTiprackId ?? '']
  const viewBox =
    selectedTiprackId != null
      ? getViewboxFromSelectedLabware(
          selectedTiprackId,
          activeDeckSetup,
          deckDef
        )
      : null

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
