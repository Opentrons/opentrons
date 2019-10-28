// @flow
import { useSelector } from 'react-redux'
import isEmpty from 'lodash/isEmpty'

import {
  selectors as robotSelectors,
  constants as robotConstants,
<<<<<<< Updated upstream
} from '../../robot'
import { getPipettesState } from '../../robot-api'
=======
  type Pipette,
} from '../../robot'
import { getPipettesState, type PipettesState } from '../../robot-api'
>>>>>>> Stashed changes
import {
  getPipetteModelSpecs,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'

export type PipetteCompatibility = 'match' | 'inexact_match' | 'incompatible'
<<<<<<< Updated upstream
=======

type InstrumentMountInfo = {
  actual: Pipette,
  protocol: Pipette,
  compatibility: PipetteCompatibility,
}
>>>>>>> Stashed changes
const { PIPETTE_MOUNTS } = robotConstants

function pipettesAreInexactMatch(protocolInstrName, actualInstrName) {
  switch (protocolInstrName) {
    case 'p300_single':
    case 'p300_single_gen1':
      return actualInstrName === 'p300_single_gen2'
    case 'p10_single':
    case 'p10_single_gen1':
      return actualInstrName === 'p20_single_gen2'
    default:
      return false
  }
}

<<<<<<< Updated upstream
function useInstrumentMountInfo(robotName: string) {
=======
function useInstrumentMountInfo(robotName: string): InstrumentMountInfo {
>>>>>>> Stashed changes
  const protocolInstruments = useSelector(robotSelectors.getPipettes)
  const actualInstruments = useSelector(state =>
    getPipettesState(state, robotName)
  )

<<<<<<< Updated upstream
  if (protocolInstruments.length === 0) return []

=======
>>>>>>> Stashed changes
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
    } else if (pipettesAreInexactMatch(protocolInstrName, actualInstrName)) {
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
