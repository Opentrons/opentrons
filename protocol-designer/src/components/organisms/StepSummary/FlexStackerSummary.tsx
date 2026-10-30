import { useSelector } from 'react-redux'

import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'

import {
  FLEX_STACKER_EMPTY,
  FLEX_STACKER_FILL,
  FLEX_STACKER_RETRIEVE,
  FLEX_STACKER_STORE,
} from '../../../constants'
import { StyledTrans } from './StyledTrans'
import { getLabwareGroupNamesString } from './utils'

import type { ReactNode } from 'react'
import type { TimelineFrame } from '@opentrons/step-generation'
import type { FormData } from '../../../form-types'

interface FlexStackerSummaryProps {
  currentStep: FormData
  moduleRobotState: TimelineFrame['modules']
}

export function FlexStackerSummary(props: FlexStackerSummaryProps): ReactNode {
  const { currentStep, moduleRobotState } = props
  const labwareDefByURI = useSelector(getLabwareDefsByURI)
  const { fillLabwareIds, flexStackerFormType, moduleId } = currentStep
  const { moduleState: stackerModuleState } = moduleRobotState[moduleId] ?? {}
  const nicknamesById = useSelector(getLabwareNicknamesById)
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
          tagInfos={[
            {
              text: labwareNameString,
            },
            {
              text: fillLabwareIds?.length ?? 0,
            },
          ]}
        />
      )
      break
    }
    case FLEX_STACKER_RETRIEVE: {
      const groupToRetrieve = stackerModuleState.labwareInHopper?.[0]
      const labwareNames =
        groupToRetrieve != null
          ? getLabwareGroupNamesString(
              groupToRetrieve,
              nicknamesById,
              labwareDefByURI
            )
          : ''

      stepSummaryContent = (
        <StyledTrans
          i18nKey={`protocol_steps:flex_stacker.${FLEX_STACKER_RETRIEVE}`}
          tagInfos={[
            {
              text: labwareNames,
            },
          ]}
        />
      )
      break
    }
    case FLEX_STACKER_STORE: {
      const groupToStore = stackerModuleState.labwareOnShuttle
      const labwareNames =
        groupToStore != null
          ? getLabwareGroupNamesString(
              groupToStore,
              nicknamesById,
              labwareDefByURI
            )
          : ''
      stepSummaryContent = (
        <StyledTrans
          i18nKey={`protocol_steps:flex_stacker.${FLEX_STACKER_STORE}`}
          tagInfos={[
            {
              text: labwareNames,
            },
          ]}
        />
      )
      break
    }
  }
  return stepSummaryContent
}
