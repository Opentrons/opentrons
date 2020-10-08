// @flow
// calibration panel with various calibration-related controls and info

import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { saveAs } from 'file-saver'

import type { Dispatch, State } from '../../types'
import * as Calibration from '../../calibration'
import * as PipetteOffset from '../../calibration/pipette-offset'
import * as Pipettes from '../../pipettes'
import * as TipLength from '../../calibration/tip-length'
import { CONNECTABLE } from '../../discovery'
import type { ViewableRobot } from '../../discovery/types'
import { selectors as robotSelectors } from '../../robot'
import { useTrackEvent } from '../../analytics'

import {
  useInterval,
  Card,
  ALIGN_BASELINE,
  FONT_SIZE_BODY_1,
  Link,
  Text,
  Flex,
  SPACING_3,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_TRANSFORM_CAPITALIZE,
  FONT_WEIGHT_REGULAR,
  FONT_SIZE_HEADER,
  C_DARK_GRAY,
} from '@opentrons/components'

import {
  DECK_CAL_STATUS_POLL_INTERVAL,
  DISABLED_CANNOT_CONNECT,
  DISABLED_CONNECT_TO_ROBOT,
  DISABLED_PROTOCOL_IS_RUNNING,
} from './constants'
import { DeckCalibrationControl } from './DeckCalibrationControl'
import { CheckCalibrationControl } from './CheckCalibrationControl'
import { CalibrationCardWarning } from './CalibrationCardWarning'
import { PipetteOffsets } from './PipetteOffsets'

type Props = {|
  robot: ViewableRobot,
  pipettesPageUrl: string,
|}

const EVENT_CALIBRATION_DOWNLOADED = 'calibrationDataDownloaded'
const TITLE = 'Robot Calibration'

const DOWNLOAD_CALIBRATION = 'Download your calibration data'

export function CalibrationCard(props: Props): React.Node {
  const { robot, pipettesPageUrl } = props
  const { name: robotName, status } = robot
  const notConnectable = status !== CONNECTABLE

  const dispatch = useDispatch<Dispatch>()

  // Poll deck cal status data
  useInterval(
    () => dispatch(Calibration.fetchCalibrationStatus(robotName)),
    DECK_CAL_STATUS_POLL_INTERVAL,
    true
  )

  // Fetch pipette cal (and pipettes) whenever we view a different
  // robot or the robot becomes connectable
  React.useEffect(() => {
    robotName && dispatch(Pipettes.fetchPipettes(robotName))
    robotName &&
      dispatch(PipetteOffset.fetchPipetteOffsetCalibrations(robotName))
    robotName && dispatch(TipLength.fetchTipLengthCalibrations(robotName))
  }, [dispatch, robotName, status])

  const isRunning = useSelector(robotSelectors.getIsRunning)
  const deckCalStatus = useSelector((state: State) => {
    return Calibration.getDeckCalibrationStatus(state, robotName)
  })
  const deckCalData = useSelector((state: State) => {
    return Calibration.getDeckCalibrationData(state, robotName)
  })

  const pipetteOffsetCalibrations = useSelector((state: State) => {
    return Calibration.getPipetteOffsetCalibrations(state, robotName)
  })

  const tipLengthCalibrations = useSelector((state: State) => {
    return Calibration.getTipLengthCalibrations(state, robotName)
  })

  const doTrackEvent = useTrackEvent()

  let buttonDisabledReason = null
  if (notConnectable) {
    buttonDisabledReason = DISABLED_CANNOT_CONNECT
  } else if (!robot.connected) {
    buttonDisabledReason = DISABLED_CONNECT_TO_ROBOT
  } else if (isRunning) {
    buttonDisabledReason = DISABLED_PROTOCOL_IS_RUNNING
  }

  const onClickSaveAs = e => {
    e.preventDefault()
    doTrackEvent({ name: EVENT_CALIBRATION_DOWNLOADED, properties: {} })
    saveAs(
      new Blob([
        JSON.stringify({
          deck: deckCalData,
          pipetteOffset: pipetteOffsetCalibrations,
          tipLength: tipLengthCalibrations,
        }),
      ]),
      `opentrons-${robotName}-calibration.json`
    )
  }

  const warningInsteadOfCalcheck = [
    Calibration.DECK_CAL_STATUS_SINGULARITY,
    Calibration.DECK_CAL_STATUS_BAD_CALIBRATION,
    Calibration.DECK_CAL_STATUS_IDENTITY,
  ].includes(deckCalStatus)

  return (
    <Card>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_BASELINE}>
        <Text
          as="h3"
          fontSize={FONT_SIZE_HEADER}
          fontWeight={FONT_WEIGHT_REGULAR}
          color={C_DARK_GRAY}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          paddingTop={SPACING_3}
          paddingX={SPACING_3}
        >
          {TITLE}
        </Text>
        <Link
          href="#"
          paddingTop={SPACING_3}
          paddingX={SPACING_3}
          fontSize={FONT_SIZE_BODY_1}
          onClick={onClickSaveAs}
        >
          {DOWNLOAD_CALIBRATION}
        </Link>
      </Flex>
      {warningInsteadOfCalcheck ? (
        <CalibrationCardWarning />
      ) : (
        <CheckCalibrationControl
          robotName={robotName}
          disabledReason={buttonDisabledReason}
        />
      )}
      <DeckCalibrationControl
        robotName={robotName}
        disabledReason={buttonDisabledReason}
        deckCalStatus={deckCalStatus}
        deckCalData={deckCalData}
      />
      <PipetteOffsets pipettesPageUrl={pipettesPageUrl} robot={robot} />
    </Card>
  )
}
