// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { i18n } from '../localization'
import {
  Flex,
  Text,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  C_DARK_GRAY,
} from '@opentrons/components'
import {
  getBatchEditSelectedStepTypes,
  getHoveredItem,
} from '../ui/steps/selectors'
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
  return (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      height="75%"
    >
      <Text id="Text_noSharedSettings" color={C_DARK_GRAY}>
        {i18n.t('application.no_batch_edit_shared_settings')}
      </Text>
    </Flex>
  )
}

export const DeckSetupManager = (): React.Node => {
  const batchEditSelectedStepTypes = useSelector(getBatchEditSelectedStepTypes)
  const hoveredItem = useSelector(getHoveredItem)

  if (batchEditSelectedStepTypes.length === 0 || hoveredItem !== null) {
    // not batch edit mode, or batch edit while item is hovered: show the deck
    return <DeckSetup />
  } else if (hasSharedBatchEditSettings(batchEditSelectedStepTypes)) {
    return null
  } else {
    return <NoBatchEditSharedSettings />
  }
}
