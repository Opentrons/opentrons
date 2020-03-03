// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { selectors as robotSelectors } from '../../robot'
import { PIPETTE_MOUNTS } from '../../pipettes'
import { getCalibratePipettesLocations } from '../../nav'
import { TitledList } from '@opentrons/components'
import { PipetteListItem } from './PipetteListItem'

// TODO(mc, 2019-12-10): i18n
const PIPETTE_CALIBRATION = 'Pipette Calibration'

export const PipetteList = withRouter(PipetteListComponent)

function PipetteListComponent() {
  const pipettes = useSelector(robotSelectors.getPipettes)
  const urlsByMount = useSelector(getCalibratePipettesLocations)

  return (
    <TitledList title={PIPETTE_CALIBRATION}>
      {PIPETTE_MOUNTS.map(mount => {
        const pipette = pipettes.find(i => i.mount === mount) || null
        const { path, disabledReason = null } = urlsByMount[mount]

        return (
          <PipetteListItem
            key={mount}
            mount={mount}
            pipette={pipette}
            calibrateUrl={path}
            disabledReason={disabledReason}
          />
        )
      })}
    </TitledList>
  )
}
