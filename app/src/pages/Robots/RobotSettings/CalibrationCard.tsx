// calibration panel with various calibration-related controls and info

import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { saveAs } from 'file-saver'
import { Trans, useTranslation } from 'react-i18next'

import type { Dispatch, State } from '../../../redux/types'
import * as Calibration from '../../../redux/calibration'
import * as PipetteOffset from '../../../redux/calibration/pipette-offset'
import * as Pipettes from '../../../redux/pipettes'
import * as TipLength from '../../../redux/calibration/tip-length'
import { CONNECTABLE } from '../../../redux/discovery'
import type { ViewableRobot } from '../../../redux/discovery/types'
import type {
  AttachedPipettesByMount,
  PipetteCalibrationsByMount,
} from '../../../redux/pipettes/types'
import { selectors as robotSelectors } from '../../../redux/robot'
import { useTrackEvent } from '../../../redux/analytics'

import {
  useInterval,
  Card,
  Box,
  BORDER_SOLID_LIGHT,
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
  C_BLUE,
} from '@opentrons/components'

import { DeckCalibrationControl } from './DeckCalibrationControl'
import { CheckCalibrationControl } from './CheckCalibrationControl'
import { PipetteOffsets } from './PipetteOffsets'

interface Props {
  robot: ViewableRobot
  pipettesPageUrl: string
}

const DECK_CAL_STATUS_POLL_INTERVAL = 10000
const CAL_ARTICLE_URL =
  'https://support.opentrons.com/en/articles/3499692-how-calibration-works-on-the-ot-2'

const attachedPipetteCalPresent: (
  pipettes: AttachedPipettesByMount,
  pipetteCalibrations: PipetteCalibrationsByMount
) => boolean = (pipettes, pipetteCalibrations) => {
  for (const m of Pipettes.PIPETTE_MOUNTS) {
    if (pipettes[m]) {
      if (!pipetteCalibrations[m].offset || !pipetteCalibrations[m].tipLength) {
        return false
      }
    }
  }
  return true
}

export function CalibrationCard(props: Props): JSX.Element {
  const { robot, pipettesPageUrl } = props
  const { name: robotName, status } = robot
  const notConnectable = status !== CONNECTABLE

  const { t } = useTranslation(['robot_calibration', 'shared'])
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

  const attachedPipettes = useSelector((state: State) => {
    return Pipettes.getAttachedPipettes(state, robotName)
  })
  const pipettePresent = !!attachedPipettes.left || !!attachedPipettes.right

  const attachedPipetteCalibrations = useSelector((state: State) => {
    return Pipettes.getAttachedPipetteCalibrations(state, robotName)
  })
  const pipetteCalPresent = attachedPipetteCalPresent(
    attachedPipettes,
    attachedPipetteCalibrations
  )

  const doTrackEvent = useTrackEvent()

  let buttonDisabledReason = null
  if (notConnectable) {
    buttonDisabledReason = t('shared:disabled_cannot_connect')
  } else if (!robot.connected) {
    buttonDisabledReason = t('shared:disabled_connect_to_robot')
  } else if (isRunning) {
    buttonDisabledReason = t('shared:disabled_protocol_is_running')
  } else if (!pipettePresent) {
    buttonDisabledReason = t('shared:disabled_no_pipette_attached')
  }

  const onClickSaveAs: React.MouseEventHandler = e => {
    e.preventDefault()
    doTrackEvent({
      name: Calibration.EVENT_CALIBRATION_DOWNLOADED,
      properties: {},
    })
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

  const displayCalCheck =
    !([
      Calibration.DECK_CAL_STATUS_SINGULARITY,
      Calibration.DECK_CAL_STATUS_BAD_CALIBRATION,
      Calibration.DECK_CAL_STATUS_IDENTITY,
    ] as Array<typeof deckCalStatus>).includes(deckCalStatus) &&
    pipetteCalPresent &&
    pipettePresent

  const pipOffsetDataPresent = pipetteOffsetCalibrations
    ? pipetteOffsetCalibrations.length > 0
    : false

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
          {t('title')}
        </Text>
        <Link
          href="#"
          color={C_BLUE}
          paddingTop={SPACING_3}
          paddingX={SPACING_3}
          fontSize={FONT_SIZE_BODY_1}
          onClick={onClickSaveAs}
        >
          {t('download_calibration')}
        </Link>
      </Flex>
      <Box
        borderBottom={BORDER_SOLID_LIGHT}
        fontSize={FONT_SIZE_BODY_1}
        padding={SPACING_3}
      >
        <Text>
          <Trans
            t={t}
            i18nKey="definition"
            components={{
              a: <Link color={C_BLUE} external href={CAL_ARTICLE_URL} />,
            }}
          />
        </Text>
      </Box>
      <DeckCalibrationControl
        robotName={robotName}
        disabledReason={buttonDisabledReason}
        deckCalStatus={deckCalStatus}
        deckCalData={deckCalData}
        pipOffsetDataPresent={pipOffsetDataPresent}
      />
      <PipetteOffsets pipettesPageUrl={pipettesPageUrl} robot={robot} />
      {displayCalCheck ? (
        <CheckCalibrationControl
          robotName={robotName}
          disabledReason={buttonDisabledReason}
        />
      ) : null}
    </Card>
  )
}
