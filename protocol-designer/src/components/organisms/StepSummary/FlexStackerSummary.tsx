import { useSelector } from 'react-redux'

import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'

import {
  FLEX_STACKER_EMPTY,
  FLEX_STACKER_FILL,
  FLEX_STACKER_RETRIEVE,
  FLEX_STACKER_STORE,
} from '../../../constants'
import { StyledTrans } from './StyledTrans'

import type {
  FlexStackerModuleState,
  TimelineFrame,
} from '@opentrons/step-generation'
import type { FormData } from '../../../form-types'

interface FlexStackerSummaryProps {
  currentStep: FormData
  moduleRobotState: TimelineFrame['modules']
}

export function FlexStackerSummary(
  props: FlexStackerSummaryProps
): JSX.Element | null {
  const { currentStep, moduleRobotState } = props
  const { fillLabwareIds, flexStackerFormType, moduleId } = currentStep
  if (moduleRobotState[moduleId] == null) {
    console.error(
      `expected to find the stacker module state but could not with moduleId ${moduleId}`
    )
  }
  const stackerModuleState: FlexStackerModuleState = moduleRobotState[moduleId]
    .moduleState as FlexStackerModuleState
  let stepSummaryContent: JSX.Element | null = null
  const { primaryLabwareURI, adapterLabwareURI, lidLabwareURI } =
    stackerModuleState.storedLabwareDetails ?? {}

  const labwareDefByURI = useSelector(getLabwareDefsByURI)

  const labwareNameString = [
    adapterLabwareURI,
    primaryLabwareURI,
    lidLabwareURI,
  ]
    .filter(Boolean)
    .map(uri => labwareDefByURI[uri!]?.metadata?.displayName)
    .filter(Boolean)
    .join(', ')

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
          tagText={labwareNameString}
          tagText2={fillLabwareIds?.length ?? 0}
        />
      )
      break
    }
    case FLEX_STACKER_RETRIEVE: {
      stepSummaryContent = (
        <StyledTrans
          i18nKey={`protocol_steps:flex_stacker.${FLEX_STACKER_RETRIEVE}`}
          tagText={labwareNameString}
        />
      )
      break
    }
    case FLEX_STACKER_STORE: {
      stepSummaryContent = (
        <StyledTrans
          i18nKey={`protocol_steps:flex_stacker.${FLEX_STACKER_STORE}`}
          tagText={labwareNameString}
        />
      )
      break
    }
  }
  return stepSummaryContent
}
