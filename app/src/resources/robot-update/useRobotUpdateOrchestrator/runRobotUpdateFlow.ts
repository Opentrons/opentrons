import { isDocumentedMutationError } from '@opentrons/react-api-client'

import { i18n } from '/app/i18n'
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
import { waitForStoreCondition } from '/app/redux/waitForStoreCondition'

import { buildHostConfig } from './buildHostConfig'
import { REDISCOVERY_TIME_MS } from './constants'
import { ensureUpdateFileReady } from './ensureUpdateFileReady'
import { getUserNotesFromDocumentationState } from './getUserNotesFromDocumentationState'
import { pollRobotUpdateStatus } from './pollRobotUpdateStatus'

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
  cancelSession: (variables: { pathPrefix: string }) => Promise<unknown>
  commitSession: (variables: {
    pathPrefix: string
    token: string
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
  isHostConfigReady: () => boolean
  getMutations: () => RobotUpdateFlowMutations
  signal: AbortSignal
}

/**
 * Linear apply-flow for one robot update.
 */
export function runRobotUpdateFlow(deps: RobotUpdateFlowDeps): Promise<void> {
  const { store, dispatch, robotName, systemFile, signal } = deps

  return ensureUpdateFileReady(store, dispatch, robotName, systemFile, signal)
    .then(session =>
      // Avoid createSession while AC settings are still loading.
      waitForDocumentationReady(deps, signal).then(() => session)
    )
    .then(session => {
      const robot = getRobotUpdateRobot(store.getState())
      if (robot == null) {
        return Promise.reject(
          new Error(
            i18n.t('unable_to_find_robot_with_name', {
              ns: 'device_settings',
              robotName,
            })
          )
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
            i18n.t('robot_has_bad_capabilities', {
              ns: 'device_settings',
              capabilities: JSON.stringify(capabilities),
            })
          )
        )
      }

      const pathPrefix = sessionPath.replace('/begin', '')
      const systemFilePath = session.fileInfo?.systemFile
      if (systemFilePath == null) {
        return Promise.reject(
          new Error(
            i18n.t('unable_to_find_system_file', { ns: 'device_settings' })
          )
        )
      }

      return createUpdateSession(deps, robot, sessionPath, pathPrefix).then(
        autoCommitAndRestart => {
          // Build HostConfig only afterward so upload/poll see the post-login token.
          const currentRobot = getRobotUpdateRobot(store.getState()) ?? robot
          return {
            robot: currentRobot,
            hostConfig: buildHostConfig(currentRobot, deps.getAccessToken()),
            pathPrefix,
            systemFilePath,
            autoCommitAndRestart,
            token: getRobotUpdateSession(store.getState())?.token,
          }
        }
      )
    })
    .then(ctx => {
      if (ctx.token == null) {
        return Promise.reject(
          new Error(
            i18n.t('unable_to_start_update_session', { ns: 'device_settings' })
          )
        )
      }

      const { robot, pathPrefix, systemFilePath, token } = ctx
      // Prefer a live token at each step — login can complete mid-flow.
      const hostConfigFor = (): HostConfig =>
        buildHostConfig(robot, deps.getAccessToken())

      return pollRobotUpdateStatus(
        hostConfigFor(),
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
            hostConfigFor(),
            pathPrefix,
            token,
            systemFilePath
          )
        )
        .then(() =>
          pollRobotUpdateStatus(
            hostConfigFor(),
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
                hostConfigFor(),
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

function waitForDocumentationReady(
  deps: RobotUpdateFlowDeps,
  signal: AbortSignal
): Promise<DocumentationState> {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const cleanup = (): void => {
      if (timeoutId != null) clearTimeout(timeoutId)
      signal.removeEventListener('abort', onAbort)
    }

    const onAbort = (): void => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal.addEventListener('abort', onAbort, { once: true })

    const tick = (): void => {
      if (signal.aborted) {
        onAbort()
        return
      }
      // Host must be ready so AC queries are enabled. Otherwise docstate looks
      // settled as "AC off" while queries have not run yet.
      const documentationState = deps.getDocumentationState()
      if (deps.isHostConfigReady() && !documentationState.isLoading) {
        cleanup()
        resolve(documentationState)
        return
      }
      timeoutId = setTimeout(tick, 50)
    }

    tick()
  })
}

function reportFlowError(dispatch: Dispatch, error: unknown): void {
  if (isAbortError(error)) return
  if (isDocumentedMutationError(error)) {
    // access_control_loading is retried in createUpdateSession; if it still
    // surfaces here, keep the session so the UI does not silently disappear.
    if (error.type === 'access_control_loading') {
      dispatch(
        unexpectedRobotUpdateError(
          i18n.t('unable_to_start_update_session', { ns: 'device_settings' })
        )
      )
      return
    }
    dispatch(clearRobotUpdateSession())
    return
  }
  const message =
    error instanceof Error
      ? error.message
      : i18n.t('unable_to_start_update_session', { ns: 'device_settings' })
  dispatch(unexpectedRobotUpdateError(message))
}

function createUpdateSession(
  deps: RobotUpdateFlowDeps,
  robot: ViewableRobot,
  sessionPath: string,
  pathPrefix: string
): Promise<boolean> {
  const { dispatch, getMutations, signal } = deps
  const robotHost = {
    name: robot.name,
    ip: robot.ip,
    port: robot.port,
  }

  dispatch(createSession(robotHost, sessionPath))

  const createOnce = (): Promise<boolean> =>
    getMutations()
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
    if (
      isDocumentedMutationError(error) &&
      error.type === 'access_control_loading'
    ) {
      return waitForDocumentationReady(deps, signal).then(() => createOnce())
    }

    const axiosError = error as AxiosError
    if (axiosError.response?.status !== 409) {
      return Promise.reject(error)
    }

    return getMutations()
      .cancelSession({ pathPrefix })
      .catch(() =>
        Promise.reject(
          new Error(
            i18n.t('unable_to_cancel_update', { ns: 'device_settings' })
          )
        )
      )
      .then(() => createOnce())
      .catch(() =>
        Promise.reject(
          new Error(
            i18n.t('unable_to_start_update_session', { ns: 'device_settings' })
          )
        )
      )
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

  const accessToken = deps.getAccessToken() ?? hostConfig.token

  return uploadRobotUpdateFileViaShell({
    ip: robot.ip,
    port: robot.port,
    name: robot.name,
    robotModel: robot.serverHealth?.robotModel ?? null,
    path,
    systemFile,
    userNotes: getUserNotesFromDocumentationState(getDocumentationState()),
    token: accessToken,
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

  const { dispatch, getMutations } = deps
  dispatch(setRobotUpdateSessionStep(COMMIT_UPDATE))

  return getMutations()
    .commitSession({
      pathPrefix,
      token,
    })
    .then(() => undefined)
    .catch((error: AxiosError) => {
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ??
        error.message
      return Promise.reject(
        new Error(
          i18n.t('unable_to_commit_update', {
            ns: 'device_settings',
            message,
          })
        )
      )
    })
}

function beginRestartPhase(
  deps: RobotUpdateFlowDeps,
  robot: ViewableRobot,
  autoCommitAndRestart: boolean
): Promise<void> {
  const { dispatch, getMutations } = deps
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

  return getMutations()
    .restartRobot()
    .then(() => {
      track()
    })
    .catch((error: AxiosError) => {
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ??
        error.message
      return Promise.reject(
        new Error(
          i18n.t('unable_to_restart', {
            ns: 'device_settings',
            message,
          })
        )
      )
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
    const actual = robotVersion ?? i18n.t('unknown', { ns: 'shared' })
    const expected = targetVersion ?? i18n.t('unknown', { ns: 'shared' })

    if (
      targetVersion != null &&
      robotVersion != null &&
      robotVersion === targetVersion
    ) {
      dispatch(setRobotUpdateSessionStep(FINISHED))
    } else {
      dispatch(
        unexpectedRobotUpdateError(
          i18n.t('robot_update_version_mismatch', {
            ns: 'device_settings',
            actual,
            expected,
          })
        )
      )
    }
    dispatch(finishDiscovery())
  })
}
