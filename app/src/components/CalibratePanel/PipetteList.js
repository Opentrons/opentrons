// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { selectors as robotSelectors } from '../../robot'
import { getFeatureFlags } from '../../config'
import { PIPETTE_MOUNTS, getAttachedPipettes } from '../../pipettes'
import { getCalibratePipettesLocations } from '../../nav'
import { fetchTipLengthCalibrations } from '../../calibration'
import {
  TitledList,
  Flex,
  Text,
  C_DARK_GRAY,
  C_MED_GRAY,
  SPACING_3,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_SEMIBOLD,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { PipetteListItem } from './PipetteListItem'
import { PipetteTiprackListItem } from './PipetteTiprackListItem'

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

export function PipetteListComponent(
  props: PipetteListComponentProps
): React.Node {
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
            <Flex key={`${mount} box`}>
              <Text
                key={`${mount} key`}
                marginLeft={SPACING_3}
                paddingTop={SPACING_3}
                color={disabledReason ? C_MED_GRAY : C_DARK_GRAY}
                fontSize={FONT_SIZE_BODY_2}
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                textTransform={TEXT_TRANSFORM_UPPERCASE}
              >
                {mount.charAt(0)}
              </Text>
              <TitledList
                key={`${mount} title`}
                title={displayName}
                disabled={!!disabledReason}
              />
            </Flex>
            {pip_tipracks?.length
              ? pip_tipracks?.map(tr => {
                  return (
                    <PipetteTiprackListItem
                      {...tr}
                      key={tr.name}
                      robotName={robotName}
                      pipette={attachedPipette}
                      calibrateUrl={path}
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
