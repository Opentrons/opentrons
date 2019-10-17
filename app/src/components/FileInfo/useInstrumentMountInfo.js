// @flow
import { useSelector } from 'react-redux'

import {
  selectors as robotSelectors,
  constants as robotConstants,
} from '../../robot'
import { getPipettesState } from '../../robot-api'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

const { PIPETTE_MOUNTS } = robotConstants

function useInstrumentMountInfo(robotName: string) {
  const protocolInstruments = useSelector(robotSelectors.getPipettes)
  const actualInstruments = useSelector(state =>
    getPipettesState(state, robotName)
  )

  if (protocolInstruments.length === 0) return []

  const instrumentInfoByMount = PIPETTE_MOUNTS.reduce((acc, mount) => {
    const protocolInstrument = protocolInstruments.find(i => i.mount === mount)
    const actualInstrument = actualInstruments[mount]

    const actualPipetteConfig = getPipetteModelSpecs(
      actualInstruments?.model || ''
    )

    const perfectMatch =
      protocolInstrument.modelSpecs?.name === actualPipetteConfig?.name

    let compatibility = 'incompatible'
    if (perfectMatch) {
      compatibility = 'match'
    } else if (pipettesAreInexactMatch(protocolInstrument, actualInstruments)) {
      compatibility = 'inexact_match'
    }

    return {
      ...acc,
      [mount]: {
        protocol: {
          ...protocolInstrument,
          displayName: protocolInstrument.modelSpecs?.displayName || 'N/A',
        },
        actual: {
          ...actualInstruments,
          modelSpecs: getPipetteModelSpecs(actualInstruments?.model || ''),
          displayName: actualInstruments?.model || 'N/A',
        },
        compatibility,
      },
    }
  })

  return instrumentInfoByMount
}

export default usePipetteInfo
