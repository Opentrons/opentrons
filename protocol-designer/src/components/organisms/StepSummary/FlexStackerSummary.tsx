import { useSelector } from 'react-redux'

import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'

import {
  FLEX_STACKER_EMPTY,
  FLEX_STACKER_FILL,
  FLEX_STACKER_RETRIEVE,
  FLEX_STACKER_STORE,
} from '../../../constants'
import { StyledTrans } from './StyledTrans'

import type { TimelineFrame } from '@opentrons/step-generation'
import type { FormData } from '../../../form-types'

interface FlexStackerSummaryProps {
  currentStep: FormData
  moduleRobotState: TimelineFrame['modules']
}

export function FlexStackerSummary(
  props: FlexStackerSummaryProps
): JSX.Element | null {
  const { currentStep, moduleRobotState } = props
  const labwareDefByURI = useSelector(getLabwareDefsByURI)
  const { fillLabwareIds, flexStackerFormType, moduleId } = currentStep
  const { moduleState: stackerModuleState } = moduleRobotState[moduleId] ?? {}
  if (
    stackerModuleState == null ||
    stackerModuleState.type !== FLEX_STACKER_MODULE_TYPE
  ) {
    console.error(
      `expected to find the stacker module state but could not with moduleId ${moduleId}`
    )
    return null
  }

  let stepSummaryContent: JSX.Element | null = null
  const { primaryLabwareURI, adapterLabwareURI, lidLabwareURI } =
    stackerModuleState.storedLabwareDetails ?? {}

  const labwareNameString = [
    adapterLabwareURI,
    primaryLabwareURI,
    lidLabwareURI,
  ]
    .reduce<string[]>((names, uri) => {
      const name = uri && labwareDefByURI[uri]?.metadata?.displayName
      if (name != null) {
        names.push(name)
      }
      return names
    }, [])
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
