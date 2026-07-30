import { isDocumentedMutationError } from '@opentrons/react-api-client'

import { getRobotApiVersion } from '/app/redux/discovery'
import { finishDiscovery, startDiscovery } from '/app/redux/discovery/actions'
import {
  RESTART_PENDING_STATUS,
  RESTART_SUCCEEDED_STATUS,
  restartStatusChanged,
} from '/app/redux/robot-admin'
import {
  clearRobotUpdateSession,
  createSession,
  createSessionSuccess,
  setRobotUpdateSessionStep,
  unexpectedRobotUpdateError,
} from '/app/redux/robot-update'
import {
  AWAITING_FILE,
  COMMIT_UPDATE,
  DONE,
  FINISHED,
  READY_FOR_RESTART,
  RESTART,
  UPLOAD_FILE,
} from '/app/redux/robot-update/constants'
import {
  getRobotUpdateRobot,
  getRobotUpdateSession,
  getRobotUpdateTargetVersion,
} from '/app/redux/robot-update/selectors'
import { uploadRobotUpdateFileViaShell } from '/app/redux/shell/remote'

import {
  BUT_WE_EXPECTED,
  CHECK_TO_VERIFY_UPDATE,
  REDISCOVERY_TIME_MS,
  ROBOT_HAS_BAD_CAPABILITIES,
  ROBOT_RECONNECTED_WITH_VERSION,
  UNABLE_TO_CANCEL_UPDATE_SESSION,
  UNABLE_TO_COMMIT_UPDATE,
  UNABLE_TO_FIND_ROBOT_WITH_NAME,
  UNABLE_TO_FIND_SYSTEM_FILE,
  UNABLE_TO_RESTART_ROBOT,
  UNABLE_TO_START_UPDATE_SESSION,
  UNKNOWN,
} from './constants'
import { buildHostConfig, ensureUpdateFileReady } from './ensureUpdateFileReady'
import { getUserNotesFromDocumentationState } from './getUserNotesFromDocumentationState'
import { pollRobotUpdateStatus } from './pollRobotUpdateStatus'
import { waitForStoreCondition } from './waitForStoreCondition'

import type { AxiosError } from 'axios'
import type { Store } from 'redux'
import type { HostConfig } from '@opentrons/api-client'
import type {
  CreateRobotUpdateSessionVariables,
  DocumentationState,
} from '@opentrons/react-api-client'
import type { ViewableRobot } from '/app/redux/discovery/types'
import type { Dispatch, State } from '/app/redux/types'

export interface RobotUpdateFlowMutations {
  createSession: (variables: CreateRobotUpdateSessionVariables) => Promise<{
    token: string
    auto_commit_and_restart?: boolean
  }>
  cancelSession: (variables: {
    pathPrefix: string
    userNotes?: string
  }) => Promise<unknown>
  commitSession: (variables: {
    pathPrefix: string
    token: string
    userNotes?: string
  }) => Promise<unknown>
  restartRobot: () => Promise<unknown>
}

export interface RobotUpdateFlowDeps {
  store: Store<State>
  dispatch: Dispatch
  robotName: string
  systemFile: string | null
  getAccessToken: () => string | null | undefined
  getDocumentationState: () => DocumentationState
  mutations: RobotUpdateFlowMutations
  signal: AbortSignal
}

/**
 * Linear apply-flow for one robot update.
 */
export function runRobotUpdateFlow(deps: RobotUpdateFlowDeps): Promise<void> {
  const { store, dispatch, robotName, systemFile, signal } = deps

  return ensureUpdateFileReady(store, dispatch, robotName, systemFile, signal)
    .then(session => {
      const robot = getRobotUpdateRobot(store.getState())
      if (robot == null) {
        return Promise.reject(
          new Error(`${UNABLE_TO_FIND_ROBOT_WITH_NAME} ${robotName}`)
        )
      }

      const capabilities = robot.serverHealth?.capabilities ?? null
      const sessionPath =
        capabilities?.buildrootUpdate ??
        capabilities?.buildrootMigration ??
        capabilities?.systemUpdate

      if (sessionPath == null) {
        return Promise.reject(
          new Error(
            `${ROBOT_HAS_BAD_CAPABILITIES}: ${JSON.stringify(capabilities)}`
          )
        )
      }

      const pathPrefix = sessionPath.replace('/begin', '')
      const systemFilePath = session.fileInfo?.systemFile
      if (systemFilePath == null) {
        return Promise.reject(new Error(UNABLE_TO_FIND_SYSTEM_FILE))
      }

      const hostConfig = buildHostConfig(robot, deps.getAccessToken())

      return createUpdateSession(deps, robot, sessionPath, pathPrefix).then(
        autoCommitAndRestart => ({
          robot,
          hostConfig,
          pathPrefix,
          systemFilePath,
          autoCommitAndRestart,
          token: getRobotUpdateSession(store.getState())?.token,
        })
      )
    })
    .then(ctx => {
      if (ctx.token == null) {
        return Promise.reject(new Error(UNABLE_TO_START_UPDATE_SESSION))
      }

      const { robot, hostConfig, pathPrefix, systemFilePath, token } = ctx

      return pollRobotUpdateStatus(
        hostConfig,
        pathPrefix,
        token,
        dispatch,
        status => status.stage === AWAITING_FILE,
        signal
      )
        .then(() =>
          uploadUpdateFile(
            deps,
            robot,
            hostConfig,
            pathPrefix,
            token,
            systemFilePath
          )
        )
        .then(() =>
          pollRobotUpdateStatus(
            hostConfig,
            pathPrefix,
            token,
            dispatch,
            status =>
              status.stage === READY_FOR_RESTART ||
              (!ctx.autoCommitAndRestart && status.stage === DONE),
            signal
          )
        )
        .then(status => {
          if (status.stage === DONE && !ctx.autoCommitAndRestart) {
            return commitIfNeeded(deps, false, pathPrefix, token).then(() =>
              pollRobotUpdateStatus(
                hostConfig,
                pathPrefix,
                token,
                dispatch,
                s => s.stage === READY_FOR_RESTART,
                signal
              )
            )
          }
          return status
        })
        .then(() => beginRestartPhase(deps, robot, ctx.autoCommitAndRestart))
        .then(() => finishAfterRestart(deps, robot))
    })
    .catch((error: unknown) => {
      reportFlowError(dispatch, error)
    })
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function reportFlowError(dispatch: Dispatch, error: unknown): void {
  if (isAbortError(error)) return
  if (isDocumentedMutationError(error)) {
    dispatch(clearRobotUpdateSession())
    return
  }
  const message =
    error instanceof Error ? error.message : UNABLE_TO_START_UPDATE_SESSION
  dispatch(unexpectedRobotUpdateError(message))
}

function createUpdateSession(
  deps: RobotUpdateFlowDeps,
  robot: ViewableRobot,
  sessionPath: string,
  pathPrefix: string
): Promise<boolean> {
  const { dispatch, mutations, getDocumentationState } = deps
  const robotHost = {
    name: robot.name,
    ip: robot.ip,
    port: robot.port,
  }

  dispatch(createSession(robotHost, sessionPath))

  const createOnce = (): Promise<boolean> =>
    mutations
      .createSession({
        sessionPath,
        autoCommitAndRestart: true,
      })
      .then(data => {
        const autoCommitAndRestart = data.auto_commit_and_restart === true
        dispatch(createSessionSuccess(robotHost, data.token, pathPrefix))
        return autoCommitAndRestart
      })

  return createOnce().catch((error: unknown) => {
    const axiosError = error as AxiosError
    if (axiosError.response?.status !== 409) {
      return Promise.reject(error)
    }

    return mutations
      .cancelSession({
        pathPrefix,
        userNotes: getUserNotesFromDocumentationState(getDocumentationState()),
      })
      .catch(() => Promise.reject(new Error(UNABLE_TO_CANCEL_UPDATE_SESSION)))
      .then(() => createOnce())
      .catch(() => Promise.reject(new Error(UNABLE_TO_START_UPDATE_SESSION)))
  })
}

function uploadUpdateFile(
  deps: RobotUpdateFlowDeps,
  robot: ViewableRobot,
  hostConfig: HostConfig,
  pathPrefix: string,
  token: string,
  systemFile: string
): Promise<unknown> {
  const { dispatch, getDocumentationState } = deps
  const path = `${pathPrefix}/${token}/file`

  dispatch(setRobotUpdateSessionStep(UPLOAD_FILE))

  return uploadRobotUpdateFileViaShell({
    ip: robot.ip,
    port: robot.port,
    name: robot.name,
    robotModel: robot.serverHealth?.robotModel ?? null,
    path,
    systemFile,
    userNotes: getUserNotesFromDocumentationState(getDocumentationState()),
    token: hostConfig.token,
  })
}

function commitIfNeeded(
  deps: RobotUpdateFlowDeps,
  autoCommitAndRestart: boolean,
  pathPrefix: string,
  token: string
): Promise<void> {
  if (autoCommitAndRestart) {
    return Promise.resolve()
  }

  const { dispatch, mutations, getDocumentationState } = deps
  dispatch(setRobotUpdateSessionStep(COMMIT_UPDATE))

  return mutations
    .commitSession({
      pathPrefix,
      token,
      userNotes: getUserNotesFromDocumentationState(getDocumentationState()),
    })
    .then(() => undefined)
    .catch((error: AxiosError) => {
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ??
        error.message
      return Promise.reject(new Error(`${UNABLE_TO_COMMIT_UPDATE}: ${message}`))
    })
}

function beginRestartPhase(
  deps: RobotUpdateFlowDeps,
  robot: ViewableRobot,
  autoCommitAndRestart: boolean
): Promise<void> {
  const { dispatch, mutations } = deps
  dispatch(setRobotUpdateSessionStep(RESTART))

  const track = (): void => {
    dispatch(
      restartStatusChanged(
        robot.name,
        RESTART_PENDING_STATUS,
        robot.serverHealth?.bootId ?? null,
        new Date()
      )
    )
    dispatch(startDiscovery(REDISCOVERY_TIME_MS))
  }

  if (autoCommitAndRestart) {
    track()
    return Promise.resolve()
  }

  return mutations
    .restartRobot()
    .then(() => {
      track()
    })
    .catch((error: AxiosError) => {
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ??
        error.message
      return Promise.reject(new Error(`${UNABLE_TO_RESTART_ROBOT}: ${message}`))
    })
}

function finishAfterRestart(
  deps: RobotUpdateFlowDeps,
  robot: ViewableRobot
): Promise<void> {
  const { store, dispatch, signal } = deps

  return waitForStoreCondition(
    store,
    state => state.robotAdmin[robot.name]?.restart?.status ?? null,
    status => status === RESTART_SUCCEEDED_STATUS,
    {
      signal,
      getError: s => getRobotUpdateSession(s)?.error ?? null,
    }
  ).then(() => {
    // Robot object may have refreshed after rediscovery.
    const currentRobot = getRobotUpdateRobot(store.getState()) ?? robot
    const targetVersion = getRobotUpdateTargetVersion(
      store.getState(),
      currentRobot.name
    )
    const robotVersion = getRobotApiVersion(currentRobot)
    const actual = robotVersion ?? UNKNOWN
    const expected = targetVersion ?? UNKNOWN

    if (
      targetVersion != null &&
      robotVersion != null &&
      robotVersion === targetVersion
    ) {
      dispatch(setRobotUpdateSessionStep(FINISHED))
    } else {
      dispatch(
        unexpectedRobotUpdateError(
          `${ROBOT_RECONNECTED_WITH_VERSION} ${actual}, ${BUT_WE_EXPECTED} ${expected}. ${CHECK_TO_VERIFY_UPDATE}.`
        )
      )
    }
    dispatch(finishDiscovery())
  })
}
