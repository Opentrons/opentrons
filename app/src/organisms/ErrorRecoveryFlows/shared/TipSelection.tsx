import * as React from 'react'

import { WellSelection } from '../../WellSelection'

import type { WellGroup } from '@opentrons/components'
import type { RecoveryContentProps } from '../types'

export type TipSelectionProps = RecoveryContentProps & {
  allowTipSelection: boolean
}

// TODO(jh, 06-13-24): EXEC-535.
export function TipSelection(props: TipSelectionProps): JSX.Element {
  const { failedLabwareUtils, failedPipetteInfo, allowTipSelection } = props

  const {
    tipSelectorDef,
    selectedTipLocations,
    selectTips,
    deselectTips,
  } = failedLabwareUtils

  const onSelectTips = (tipGroup: WellGroup): void => {
    if (allowTipSelection) {
      selectTips(tipGroup)
    }
  }

  const onDeselectTips = (locations: string[]): void => {
    if (allowTipSelection) {
      deselectTips(locations)
    }
  }

  return (
    <WellSelection
      definition={tipSelectorDef}
      deselectWells={onDeselectTips}
      selectedPrimaryWells={selectedTipLocations as WellGroup}
      selectWells={onSelectTips}
      channels={failedPipetteInfo?.data.channels ?? 1}
    />
  )
}
