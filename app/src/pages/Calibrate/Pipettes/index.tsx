// setup pipettes component
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import head from 'lodash/head'
import omit from 'lodash/omit'

import { selectors as robotSelectors } from '../../../redux/robot'
import {
  PIPETTE_MOUNTS,
  fetchPipettes,
  getProtocolPipettesInfo,
} from '../../../redux/pipettes'
import { getConnectedRobot } from '../../../redux/discovery'
import {
  getTipLengthForPipetteAndTiprack,
  getCalibrationForPipette,
} from '../../../redux/calibration'

import { Page } from '../../../atoms/Page'
import { SessionHeader } from '../../../organisms/SessionHeader'
import { PipetteTabs } from './PipetteTabs'
import { PipettesContents } from './PipettesContents'

import type { RouteComponentProps } from 'react-router-dom'
import type { State, Dispatch } from '../../../redux/types'
import type { Mount } from '../../../redux/pipettes/types'
import type { Labware, Pipette } from '../../../redux/robot/types'
import { CalibrateTipLengthControl } from '../CalibrateTipLengthControl'

type Props = RouteComponentProps<{ mount: string; definitionHash: string }>

export function Pipettes(props: Props): JSX.Element {
  const { mount, definitionHash } = props.match.params
  const dispatch = useDispatch<Dispatch>()
  const robot = useSelector(getConnectedRobot)
  const robotName = robot?.name || null
  const tipracksByMount = useSelector(robotSelectors.getTipracksByMount)
  const pipettes = useSelector((state: State) =>
    robotName ? getProtocolPipettesInfo(state, robotName) : null
  )

  const changePipetteUrl =
    robotName !== null ? `/robots/${robotName}/instruments` : '/robots'

  React.useEffect(() => {
    robotName && dispatch(fetchPipettes(robotName))
  }, [dispatch, robotName])

  const currentMount: Mount | null =
    PIPETTE_MOUNTS.find(m => m === mount) || null

  const currentPipette = currentMount && pipettes && pipettes[currentMount]

  const activeTipracks = PIPETTE_MOUNTS.reduce<
    { [m in Mount]: Labware | null }
  >(
    (mapToBuild, m) => {
      const tipracksForMount = tipracksByMount[m]
      if (m === mount) {
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

  const activeTipRack = currentPipette?.protocol?.mount
    ? activeTipracks[currentPipette.protocol.mount]
    : null

  const activeTipRackDef = activeTipRack?.definition

  const tipLengthDataForActivePipette = useSelector((state: State) => {
    return (
      robotName &&
      currentPipette?.actual?.id &&
      activeTipRack?.definitionHash &&
      getTipLengthForPipetteAndTiprack(
        state,
        robotName,
        currentPipette.actual.id,
        activeTipRack.definitionHash
      )
    )
  })

  const tipRackHash = activeTipRack ? activeTipRack.definitionHash : null

  const serialNumber = currentPipette ? currentPipette.actual?.id : null

  const convertRobotNameToString = robotName || 'unknown'
  const pipetteOffsetCalibration = useSelector((state: State) =>
    serialNumber
      ? getCalibrationForPipette(
          state,
          convertRobotNameToString,
          serialNumber,
          currentMount
        )
      : null
  )

  // @ts-expect-error TODO: reconcile the expected Pipette type with the one given here
  const protoPipettes: Pipette[] = [
    pipettes?.left?.protocol
      ? omit(pipettes.left.protocol, 'displayName')
      : null,
    pipettes?.right?.protocol
      ? omit(pipettes.right.protocol, 'displayName')
      : null,
  ].filter(Boolean)

  const isExtendedPipOffset = pipetteOffsetCalibration
    ? tipRackHash === pipetteOffsetCalibration.tiprack
    : false

  return (
    <Page titleBarProps={{ title: <SessionHeader /> }}>
      <PipetteTabs currentMount={currentMount} />
      <PipettesContents
        currentMount={currentMount}
        pipettes={protoPipettes}
        activeTipracks={activeTipracks}
        changePipetteUrl={changePipetteUrl}
      />
      {robotName && currentMount && !!activeTipRackDef ? (
        <CalibrateTipLengthControl
          mount={currentMount}
          robotName={robotName}
          hasCalibrated={!!tipLengthDataForActivePipette}
          tipRackDefinition={activeTipRackDef}
          isExtendedPipOffset={isExtendedPipOffset}
        />
      ) : null}
    </Page>
  )
}
