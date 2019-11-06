// @flow
import { useSelector } from 'react-redux'
import isEmpty from 'lodash/isEmpty'

import {
  selectors as robotSelectors,
  constants as robotConstants,
} from '../../robot'
import { getPipettesState } from '../../robot-api'
import {
  getPipetteModelSpecs,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { State } from '../../types'
import type { Pipette, Mount } from '../../robot/types'
import type { Pipette as ActualPipette } from '../../robot-api/types'

export type PipetteCompatibility = 'match' | 'inexact_match' | 'incompatible'

export type InstrumentMountInfo = {|
  actual: null | {|
    ...ActualPipette,
    displayName: string,
    modelSpecs: ?PipetteModelSpecs,
  |},
  protocol: null | {|
    ...$Shape<$Exact<Pipette>>,
    displayName: string,
  |},
  compatibility: PipetteCompatibility,
|}

const { PIPETTE_MOUNTS } = robotConstants

export const MATCH: 'match' = 'match'
export const INCOMPATIBLE: 'incompatible' = 'incompatible'
export const INEXACT_MATCH: 'inexact_match' = 'inexact_match'

function pipettesAreInexactMatch(
  protocolInstrName: ?string,
  actualModelSpecs: ?PipetteModelSpecs
) {
  const { backCompatNames } = actualModelSpecs || {}
  return backCompatNames && backCompatNames.includes(protocolInstrName)
}

function useInstrumentMountInfo(
  robotName: string
): { [Mount]: InstrumentMountInfo } {
  const protocolInstruments = useSelector<State, Array<Pipette>>(
    robotSelectors.getPipettes
  )
  const actualInstruments = useSelector(state =>
    getPipettesState(state, robotName)
  )

  const instrumentInfoByMount = PIPETTE_MOUNTS.reduce((acc, mount) => {
    const protocolInstrument = protocolInstruments.find(i => i.mount === mount)
    const actualInstrument = actualInstruments[mount]
    const requestedAs = protocolInstrument?.requestedAs

    const actualModelSpecs = getPipetteModelSpecs(actualInstrument?.model || '')
    const requestedDisplayName = requestedAs
      ? getPipetteNameSpecs(requestedAs)?.displayName
      : protocolInstrument?.modelSpecs?.displayName

    const protocolInstrName =
      protocolInstrument?.requestedAs || protocolInstrument?.modelSpecs?.name
    const actualInstrName = actualModelSpecs?.name

    const perfectMatch = protocolInstrName === actualInstrName

    let compatibility: PipetteCompatibility = INCOMPATIBLE
    if (perfectMatch || isEmpty(protocolInstrument)) {
      compatibility = MATCH
    } else if (pipettesAreInexactMatch(protocolInstrName, actualModelSpecs)) {
      compatibility = INEXACT_MATCH
    }

    return {
      ...acc,
      [mount]: {
        protocol: protocolInstrument
          ? {
              ...protocolInstrument,
              displayName: requestedDisplayName || protocolInstrument.name,
            }
          : null,
        actual:
          actualInstrument && actualModelSpecs
            ? {
                ...actualInstrument,
                modelSpecs: actualModelSpecs,
                displayName: actualModelSpecs.displayName,
              }
            : null,
        compatibility,
      },
    }
  }, {})

  return instrumentInfoByMount
}

export default useInstrumentMountInfo
