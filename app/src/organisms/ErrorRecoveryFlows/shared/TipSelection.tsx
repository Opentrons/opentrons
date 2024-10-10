import { WellSelection } from '../../WellSelection'

import type { WellGroup } from '@opentrons/components'
import type { RecoveryContentProps } from '../types'

export type TipSelectionProps = RecoveryContentProps & {
  allowTipSelection: boolean
}

export function TipSelection(props: TipSelectionProps): JSX.Element {
  const { failedLabwareUtils, failedPipetteInfo, allowTipSelection } = props

  const {
    tipSelectorDef,
    selectedTipLocation,
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
      selectedPrimaryWell={Object.keys(selectedTipLocation as WellGroup)[0]}
      selectWells={onSelectTips}
      channels={failedPipetteInfo?.data.channels ?? 1}
    />
  )
}
