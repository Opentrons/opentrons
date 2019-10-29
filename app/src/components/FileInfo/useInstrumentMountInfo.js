// @flow
import { useSelector } from 'react-redux'
import isEmpty from 'lodash/isEmpty'

import {
  selectors as robotSelectors,
  constants as robotConstants,
  type Pipette,
  type Mount,
} from '../../robot'
import {
  getPipettesState,
  type Pipette as ActualPipette,
} from '../../robot-api'
import {
  getPipetteModelSpecs,
  getPipetteNameSpecs,
  type PipetteModelSpecs,
} from '@opentrons/shared-data'

export type PipetteCompatibility = 'match' | 'inexact_match' | 'incompatible'

type InstrumentMountInfo = {|
  actual: {|
    ...ActualPipette,
    displayName: string,
    modelSpecs: ?PipetteModelSpecs,
  |},
  protocol: {|
    ...$Exact<Pipette>,
    displayName: string,
  |},
  compatibility: PipetteCompatibility,
|}
const { PIPETTE_MOUNTS } = robotConstants

function pipettesAreInexactMatch(
  protocolInstrName,
  actualModelSpecs: ?PipetteModelSpecs
) {
  const { backcompatName } = actualModelSpecs || {}
  return protocolInstrName === backcompatName
}

function useInstrumentMountInfo(
  robotName: string
): { [Mount]: InstrumentMountInfo } {
  const protocolInstruments = useSelector(robotSelectors.getPipettes)
  const actualInstruments = useSelector(state =>
    getPipettesState(state, robotName)
  )

  const instrumentInfoByMount = PIPETTE_MOUNTS.reduce((acc, mount) => {
    const protocolInstrument = protocolInstruments.find(i => i.mount === mount)
    const actualInstrument = actualInstruments[mount]

    const actualPipetteConfig = getPipetteModelSpecs(
      actualInstrument?.model || ''
    )
    const requestedDisplayName = protocolInstrument?.requestedAs
      ? getPipetteNameSpecs(protocolInstrument?.requestedAs)?.displayName
      : protocolInstrument?.modelSpecs?.displayName

    const protocolInstrName =
      protocolInstrument?.requestedAs || protocolInstrument?.modelSpecs?.name
    const actualInstrName = actualPipetteConfig?.name

    const perfectMatch = protocolInstrName === actualInstrName

    let compatibility: PipetteCompatibility = 'incompatible'
    if (perfectMatch || isEmpty(protocolInstrument)) {
      compatibility = 'match'
    } else if (
      pipettesAreInexactMatch(protocolInstrName, actualPipetteConfig)
    ) {
      compatibility = 'inexact_match'
    }

    return {
      ...acc,
      [mount]: {
        protocol: {
          ...protocolInstrument,
          displayName: requestedDisplayName || 'N/A',
        },
        actual: {
          ...actualInstrument,
          modelSpecs: actualPipetteConfig,
          displayName: actualPipetteConfig?.displayName || 'N/A',
        },
        compatibility,
      },
    }
  }, {})

  return instrumentInfoByMount
}

export default useInstrumentMountInfo
