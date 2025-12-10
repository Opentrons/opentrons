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
  const { fillLabwareUri, fillQuantity, flexStackerFormType } = currentStep
  const labwareName = Object.values(labwareEntities).find(
    lw => lw.labwareDefURI === fillLabwareUri
  )?.def.metadata.displayName
  let stepSummaryContent: JSX.Element | null = null

  switch (flexStackerFormType) {
    case 'empty': {
      stepSummaryContent = (
        <StyledTrans i18nKey="protocol_steps:flex_stacker.empty" />
      )
      break
    }
    case 'fill': {
      stepSummaryContent = (
        <StyledTrans
          i18nKey="protocol_steps:flex_stacker.fill"
          tagText={labwareName}
          tagText2={fillQuantity}
        />
      )
      break
    }
    case 'retrieve': {
      stepSummaryContent = (
        <StyledTrans
          i18nKey="protocol_steps:flex_stacker.retrieve"
          tagText={labwareName}
        />
      )
      break
    }
    case 'store': {
      stepSummaryContent = (
        <StyledTrans
          i18nKey="protocol_steps:flex_stacker.store"
          tagText={labwareName}
        />
      )
      break
    }
  }
  return stepSummaryContent
}
