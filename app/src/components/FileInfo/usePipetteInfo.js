// @flow
import { useSelector } from 'react-redux'

import { selectors as robotSelectors } from '../../robot'
import { getPipettesState } from '../../robot-api'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

function usePipetteInfo(robotName: string) {
  const protocolPipettes = useSelector(robotSelectors.getPipettes)
  const actualPipettes = useSelector(state =>
    getPipettesState(state, robotName)
  )

  if (protocolPipettes.length === 0) return []

  const pipetteInfo = protocolPipettes.map(p => {
    const pipetteConfig = p.modelSpecs
    const actualPipetteConfig = getPipetteModelSpecs(
      actualPipettes[p.mount]?.model || ''
    )
    const displayName = pipetteConfig?.displayName || 'N/A'

    const pipettesMatch =
      pipetteConfig && pipetteConfig.name === actualPipetteConfig?.name

    return {
      ...p,
      displayName,
      pipettesMatch,
    }
  })

  return pipetteInfo
}

export default usePipetteInfo
