// @flow
// setup pipettes component
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import head from 'lodash/head'

import { selectors as robotSelectors } from '../../robot'
import { PIPETTE_MOUNTS, fetchPipettes } from '../../pipettes'
import { getConnectedRobot } from '../../discovery'
import { getFeatureFlags } from '../../config'

import { Page } from '../../components/Page'
import { TipProbe } from '../../components/TipProbe'
import {
  PipetteTabs,
  Pipettes as PipettesContents,
} from '../../components/calibrate-pipettes'
import { SessionHeader } from '../../components/SessionHeader'

import type { ContextRouter } from 'react-router-dom'
import type { Dispatch } from '../../types'
import type { Mount } from '../../pipettes/types'
import type { Labware } from '../../robot/types'
import { CalibrateTipLengthControl } from './CalibrateTipLengthControl'

type Props = ContextRouter

export function Pipettes(props: Props): React.Node {
  const { mount, definitionHash } = props.match.params
  const dispatch = useDispatch<Dispatch>()
  const robot = useSelector(getConnectedRobot)
  const ff = useSelector(getFeatureFlags)
  const robotName = robot?.name || null
  const tipracksByMount = useSelector(robotSelectors.getTipracksByMount)
  const pipettes = useSelector(robotSelectors.getPipettes)

  const changePipetteUrl =
    robotName !== null ? `/robots/${robotName}/instruments` : '/robots'

  React.useEffect(() => {
    robotName && dispatch(fetchPipettes(robotName))
  }, [dispatch, robotName])

  const currentMount: Mount | null =
    PIPETTE_MOUNTS.find(m => m === mount) || null

  const currentPipette = pipettes.find(p => p.mount === currentMount) || null

  const activeTipracks = PIPETTE_MOUNTS.reduce<{|
    left: Labware | null,
    right: Labware | null,
  |}>(
    (mapToBuild, m) => {
      const tipracksForMount = tipracksByMount[m]
      if (m === mount && ff.enableCalibrationOverhaul) {
        // If this is the active mount, and if the feature flag is active,
        // definitionHash applies to this list
        mapToBuild[m] = definitionHash
          ? tipracksForMount.find(tr => tr.definitionHash === definitionHash) ||
            null
          : head(tipracksForMount) || null
      } else {
        // In all other cases - yes feature flag but mount inactive, either
        // no-feature-flag case - we just want the first tiprack
        mapToBuild[m] = head(tipracksForMount) || null
      }
      return mapToBuild
    },
    { left: null, right: null }
  )

  const activeTipRackDef = (currentPipette
    ? activeTipracks[currentPipette.mount]
    : null
  )?.definition

  return (
    <Page titleBarProps={{ title: <SessionHeader /> }}>
      <PipetteTabs currentMount={currentMount} />
      <PipettesContents
        {...{
          currentMount,
          pipettes,
          activeTipracks,
          changePipetteUrl,
        }}
      />
      {robotName &&
        !!currentPipette &&
        (ff.enableCalibrationOverhaul ? (
          !!activeTipRackDef ? (
            <CalibrateTipLengthControl
              mount={currentPipette.mount}
              robotName={robotName}
              hasCalibrated={currentPipette.probed}
              tipRackDefinition={activeTipRackDef}
            />
          ) : null
        ) : (
          <TipProbe {...currentPipette} />
        ))}
    </Page>
  )
}
