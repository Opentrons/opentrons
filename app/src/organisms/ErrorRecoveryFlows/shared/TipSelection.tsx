import { WellSelection } from '../../WellSelection'

import type { WellGroup } from '@opentrons/components'
import type { NozzleLayoutDetails } from '@opentrons/shared-data'
import type { RecoveryContentProps } from '../types'

export type TipSelectionProps = RecoveryContentProps & {
  allowTipSelection: boolean
}

export function TipSelection(props: TipSelectionProps): JSX.Element {
  const { failedLabwareUtils, failedPipetteUtils, allowTipSelection } = props
  const {
    tipSelectorDef,
    selectedTipLocation,
    selectTips,
    deselectTips,
  } = failedLabwareUtils
  const { relevantActiveNozzleLayout, failedPipetteInfo } = failedPipetteUtils

  const onSelectTips = (tipGroup: WellGroup): void => {
    selectTips(tipGroup)
  }

  const onDeselectTips = (locations: string[]): void => {
    deselectTips(locations)
  }

  return (
    <WellSelection
      definition={tipSelectorDef}
      deselectWells={onDeselectTips}
      selectedPrimaryWell={Object.keys(selectedTipLocation as WellGroup)[0]}
      selectWells={onSelectTips}
      channels={failedPipetteInfo?.data.channels ?? 1}
      pipetteNozzleDetails={buildNozzleLayoutDetails(
        relevantActiveNozzleLayout
      )}
      allowSelect={allowTipSelection}
    />
  )
}

function buildNozzleLayoutDetails(
  relevantActiveNozzleLayout: TipSelectionProps['failedPipetteUtils']['relevantActiveNozzleLayout']
): NozzleLayoutDetails | undefined {
  return relevantActiveNozzleLayout != null
    ? {
        activeNozzleCount: relevantActiveNozzleLayout.activeNozzles.length,
        nozzleConfig: relevantActiveNozzleLayout.config,
      }
    : undefined
}
