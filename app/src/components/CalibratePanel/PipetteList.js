// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { selectors as robotSelectors } from '../../robot'
import { getFeatureFlags } from '../../config'
import { PIPETTE_MOUNTS, getAttachedPipettes } from '../../pipettes'
import { getCalibratePipettesLocations } from '../../nav'
import { fetchTipLengthCalibrations } from '../../calibration'
import { TitledList } from '@opentrons/components'
import { PipetteListItem } from './PipetteListItem'
import { PipetteTiprackListItem } from './PipetteTiprackListItem'
import styles from './styles.css'

import type { BaseProtocolLabware } from '../../calibration/types'
import type { Dispatch, State } from '../../types'

// TODO(mc, 2019-12-10): i18n
const PIPETTE_CALIBRATION = 'Pipette Calibration'
const TIP_LENGTH_CALIBRATION = 'Tip Length Calibration'

export type PipetteListComponentProps = {|
  robotName: string | null,
  tipracks: Array<BaseProtocolLabware>,
|}

export const PipetteList: React.AbstractComponent<PipetteListComponentProps> = withRouter(
  PipetteListComponent
)

function PipetteListComponent(props: PipetteListComponentProps) {
  const dispatch = useDispatch<Dispatch>()

  const { robotName, tipracks } = props
  const protocolPipettes = useSelector(robotSelectors.getPipettes)
  const urlsByMount = useSelector(getCalibratePipettesLocations)
  const attachedPipettes = useSelector((state: State) =>
    getAttachedPipettes(state, robotName)
  )
  const ff = useSelector(getFeatureFlags)

  React.useEffect(() => {
    robotName && dispatch(fetchTipLengthCalibrations(robotName))
  }, [dispatch, robotName])

  return (
    <TitledList
      title={
        !ff.enableCalibrationOverhaul
          ? PIPETTE_CALIBRATION
          : TIP_LENGTH_CALIBRATION
      }
    >
      {PIPETTE_MOUNTS.map(mount => {
        const protocolPipette =
          protocolPipettes.find(i => i.mount === mount) || null
        const attachedPipette = attachedPipettes[mount]
        const displayName = protocolPipette?.modelSpecs?.displayName || 'N/A'
        const { path, disabledReason = null } = urlsByMount[mount]
        const pip_tipracks = tipracks.filter(t => t.calibratorMount === mount)
        return !ff.enableCalibrationOverhaul ? (
          <PipetteListItem
            key={mount}
            mount={mount}
            pipette={protocolPipette}
            calibrateUrl={path}
            disabledReason={disabledReason}
          />
        ) : (
          <>
            <div key={mount} className={styles.item_info}>
              <span className={styles.pipette_mount}>
                <h3 className={styles.pipette_mount_title}>
                  {mount.charAt(0)}
                </h3>
              </span>
              <span>
                <TitledList key={mount} title={displayName} />
              </span>
            </div>
            {pip_tipracks?.length
              ? pip_tipracks?.map(tr => {
                  return (
                    <PipetteTiprackListItem
                      key={tr.name}
                      robotName={robotName}
                      pipette={attachedPipette}
                      calibrateUrl={path}
                      tiprack={tr}
                    />
                  )
                })
              : null}
          </>
        )
      })}
    </TitledList>
  )
}
