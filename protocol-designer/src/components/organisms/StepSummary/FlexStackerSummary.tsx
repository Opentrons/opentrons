import {
  FLEX_STACKER_EMPTY,
  FLEX_STACKER_FILL,
  FLEX_STACKER_RETRIEVE,
  FLEX_STACKER_STORE,
} from '../../../constants'
import { StyledTrans } from './StyledTrans'

import type { LabwareEntities } from '@opentrons/step-generation'
import type { FormData } from '../../../form-types'

interface FlexStackerSummaryProps {
  currentStep: FormData
  labwareEntities: LabwareEntities
}

export function FlexStackerSummary(
  props: FlexStackerSummaryProps
): JSX.Element | null {
  const { currentStep, labwareEntities } = props
  const { fillPrimaryLabwareUri, fillQuantity, flexStackerFormType } =
    currentStep
  const labwareName = Object.values(labwareEntities).find(
    ({ labwareDefURI }) => labwareDefURI === fillPrimaryLabwareUri
  )?.def.metadata.displayName
  let stepSummaryContent: JSX.Element | null = null

  switch (flexStackerFormType) {
    case FLEX_STACKER_EMPTY: {
      stepSummaryContent = (
        <StyledTrans
          i18nKey={`protocol_steps:flex_stacker.${FLEX_STACKER_EMPTY}`}
        />
      )
      break
    }
    case FLEX_STACKER_FILL: {
      stepSummaryContent = (
        <StyledTrans
          i18nKey={`protocol_steps:flex_stacker.${FLEX_STACKER_FILL}`}
          tagText={labwareName}
          tagText2={fillQuantity}
        />
      )
      break
    }
    case FLEX_STACKER_RETRIEVE: {
      stepSummaryContent = (
        <StyledTrans
          i18nKey={`protocol_steps:flex_stacker.${FLEX_STACKER_RETRIEVE}`}
          tagText={labwareName}
        />
      )
      break
    }
    case FLEX_STACKER_STORE: {
      stepSummaryContent = (
        <StyledTrans
          i18nKey={`protocol_steps:flex_stacker.${FLEX_STACKER_STORE}`}
          tagText={labwareName}
        />
      )
      break
    }
  }
  return stepSummaryContent
}
