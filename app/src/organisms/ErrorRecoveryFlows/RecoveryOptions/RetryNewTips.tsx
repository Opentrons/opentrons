import * as React from 'react'

import { RECOVERY_MAP } from '../constants'
import { RecoverySingleColumnContent, RecoveryFooterButtons } from '../shared'
import { WellSelection } from '../../WellSelection'

import type { WellGroup } from '@opentrons/components'
import type { RecoveryContentProps } from '../types'

export function RetryNewTips(props: RecoveryContentProps): JSX.Element | null {
  const { recoveryMap } = props

  const buildContent = (): JSX.Element | null => {
    const { RETRY_NEW_TIPS } = RECOVERY_MAP
    const { step } = recoveryMap

    switch (step) {
      case RETRY_NEW_TIPS.STEPS.REPLACE_TIPS:
        return <ReplaceTips {...props} />
      case RETRY_NEW_TIPS.STEPS.SELECT_TIPS:
        return <SelectTips {...props} />
      case RETRY_NEW_TIPS.STEPS.RETRY:
      default:
        return <ReplaceTips {...props} />
    }
  }

  return buildContent()
}

export function ReplaceTips({
  isOnDevice,
  routeUpdateActions,
}: RecoveryContentProps): JSX.Element | null {
  const { proceedNextStep } = routeUpdateActions

  const primaryOnClick = (): void => {
    void proceedNextStep()
  }

  return (
    <RecoverySingleColumnContent>
      {'PLACEHOLDER'}
      <RecoveryFooterButtons
        isOnDevice={isOnDevice}
        primaryBtnOnClick={primaryOnClick}
      />
    </RecoverySingleColumnContent>
  )
}

export function SelectTips(props: RecoveryContentProps): JSX.Element | null {
  const { failedLabwareUtils, failedPipetteInfo } = props
  const {
    tipSelectorDef,
    selectedTipLocations,
    selectTips,
    deselectTips,
  } = failedLabwareUtils

  return (
    <WellSelection
      definition={tipSelectorDef}
      deselectWells={deselectTips}
      selectedPrimaryWells={selectedTipLocations as WellGroup}
      selectWells={selectTips}
      channels={failedPipetteInfo?.data.channels ?? 1}
    />
  )
}
