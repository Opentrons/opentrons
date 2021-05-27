import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import * as RobotApi from '../../../redux/robot-api'
import * as Sessions from '../../../redux/sessions'
import * as Config from '../../../redux/config'

import {
  Icon,
  SecondaryBtn,
  BORDER_SOLID_LIGHT,
  Tooltip,
  useHoverTooltip,
  SpinnerModalPage,
} from '@opentrons/components'

import { Portal } from '../../../App/portal'
import { CheckCalibration } from '../../../organisms/CheckCalibration'
import { AskForCalibrationBlockModal } from '../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'
import { TitledControl } from '../../../atoms/TitledControl'

import type { SessionCommandString } from '../../../redux/sessions/types'
import type { RequestState } from '../../../redux/robot-api/types'

import type { State } from '../../../redux/types'

export interface CheckCalibrationControlProps {
  robotName: string
  disabledReason: string | null
}

// pipette calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export function CheckCalibrationControl({
  robotName,
  disabledReason,
}: CheckCalibrationControlProps): JSX.Element {
  const { t } = useTranslation(['robot_calibration', 'shared'])
  const [targetProps, tooltipProps] = useHoverTooltip()

  const trackedRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        // @ts-expect-error TODO: should be the code in comment below
        createRequestId.current = dispatchedAction.meta.requestId
        // createRequestId.current =
        //   'requestId' in dispatchedAction.meta
        //     ? dispatchedAction.meta.requestId ?? null
        //     : null
      } else if (
        dispatchedAction.type === Sessions.CREATE_SESSION_COMMAND &&
        dispatchedAction.payload.command.command ===
          Sessions.sharedCalCommands.JOG
      ) {
        jogRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        trackedRequestId.current =
          'meta' in dispatchedAction && 'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      }
    }
  )

  const createStatus = useSelector<State, RequestState | null>(state =>
    createRequestId.current
      ? RobotApi.getRequestById(state, createRequestId.current)
      : null
  )?.status

  const showSpinner =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current
        ? RobotApi.getRequestById(state, trackedRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const isJogging =
    useSelector((state: State) =>
      jogRequestId.current
        ? RobotApi.getRequestById(state, jogRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  React.useEffect(() => {
    if (createStatus === RobotApi.SUCCESS) {
      createRequestId.current = null
    }
  }, [createStatus])

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)
  const [showCalBlockModal, setShowCalBlockModal] = React.useState(false)

  const handleStart = (hasBlockModalResponse: boolean | null = null): void => {
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setShowCalBlockModal(true)
    } else {
      setShowCalBlockModal(false)
      dispatchRequests(
        Sessions.ensureSession(
          robotName,
          Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
          {
            tipRacks: [],
            hasCalibrationBlock: Boolean(
              configHasCalibrationBlock ?? hasBlockModalResponse
            ),
          }
        )
      )
    }
  }

  const checkHealthSession = useSelector((state: State) => {
    const session: Sessions.Session | null = Sessions.getRobotSessionOfType(
      state,
      robotName,
      Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
    )
    if (
      session &&
      session.sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
    ) {
      return session
    }
    return null
  })

  const buttonDisabled = Boolean(disabledReason) || showSpinner

  const buttonChildren = showSpinner ? (
    <Icon name="ot-spinner" height="1em" spin />
  ) : (
    t('health_check_button')
  )

  return (
    <>
      <TitledControl
        borderBottom={BORDER_SOLID_LIGHT}
        title={t('health_check_title')}
        description={t('health_check_description')}
        control={
          <SecondaryBtn
            {...targetProps}
            minWidth="12rem"
            onClick={() => handleStart(null)} // passing in null because we want to show the AskForBlock modal
            disabled={buttonDisabled}
          >
            {buttonChildren}
          </SecondaryBtn>
        }
      >
        {disabledReason !== null && (
          <Tooltip {...tooltipProps}>{disabledReason}</Tooltip>
        )}
      </TitledControl>
      <Portal level="top">
        {showCalBlockModal ? (
          <AskForCalibrationBlockModal
            onResponse={handleStart}
            titleBarTitle={t('health_check_title')}
            closePrompt={() => setShowCalBlockModal(false)}
          />
        ) : null}
        {createStatus === RobotApi.PENDING ? (
          <SpinnerModalPage
            titleBar={{
              title: t('health_check_title'),
              back: {
                disabled: true,
                title: t('shared:exit'),
                children: t('shared:exit'),
              },
            }}
          />
        ) : null}
        <CheckCalibration
          session={checkHealthSession}
          robotName={robotName}
          dispatchRequests={dispatchRequests}
          showSpinner={showSpinner}
          isJogging={isJogging}
        />
      </Portal>
    </>
  )
}
