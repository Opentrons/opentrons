// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { getBatchEditSelectedStepTypes } from '../ui/steps/selectors'
import { DeckSetup } from './DeckSetup'
import type { StepType } from '../form-types'

// TODO IMMEDIATELY: move to some util file?
const hasSharedBatchEditSettings: (
  stepType: Array<StepType>
) => boolean = stepTypes => {
  // NOTE(IL, 2021-02-19): if in the future we support batch edit of multiple step types,
  // we would add more cases here
  return stepTypes.length === 1
}

const NoBatchEditSharedSettings = (): React.Node => {
  // TOOD IMMEDIATELY: style & use i18n
  return 'No advanced settings shared between selected steps'
}

export const DeckSetupManager = (): React.Node => {
  const batchEditSelectedStepTypes = useSelector(getBatchEditSelectedStepTypes)

  if (batchEditSelectedStepTypes.length === 0) {
    // not batch edit mode, show the deck
    return <DeckSetup />
  } else if (hasSharedBatchEditSettings(batchEditSelectedStepTypes)) {
    return null
  } else {
    return <NoBatchEditSharedSettings />
  }
}
