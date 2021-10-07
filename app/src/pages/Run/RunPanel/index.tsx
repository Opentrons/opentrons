import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Fragment, useRef, useEffect } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../../redux/robot'
import { getMissingModules } from '../../../redux/modules'
import { getConnectedRobot } from '../../../redux/discovery'

import { SidePanel, SidePanelGroup } from '@opentrons/components'
import { RunTimer } from './RunTimer'
import { RunControls } from './RunControls'
import { ModuleLiveStatusCards } from './ModuleLiveStatusCards'
import { useFeatureFlag } from '../../../redux/config'
import { RunTimeControl } from '../../../organisms/RunTimeControl'

import type { MapDispatchToProps } from 'react-redux'
import type { State } from '../../../redux/types'

interface SP {
  isRunning: boolean
  isPaused: boolean
  isReadyToRun: boolean
  isBlocked: boolean
  modulesReady: boolean
  disabled: boolean
}

interface DP {
  onRunClick: () => unknown
  onPauseClick: () => unknown
  onResumeClick: () => unknown
  onResetClick: () => unknown
}

type Props = SP & DP

const mapStateToProps = (state: State): SP => ({
  isRunning: robotSelectors.getIsRunning(state),
  isPaused: robotSelectors.getIsPaused(state),
  isReadyToRun: robotSelectors.getIsReadyToRun(state),
  isBlocked: robotSelectors.getIsBlocked(state),
  modulesReady: getMissingModules(state).length === 0,
  disabled:
    !robotSelectors.getSessionIsLoaded(state) ||
    robotSelectors.getCancelInProgress(state) ||
    robotSelectors.getSessionLoadInProgress(state),
})

const mapDispatchToProps: MapDispatchToProps<DP, {}> = dispatch => ({
  onRunClick: () => dispatch(robotActions.run()),
  onPauseClick: () => dispatch(robotActions.pause()),
  onResumeClick: () => dispatch(robotActions.resume()),
  onResetClick: () => dispatch(robotActions.refreshSession()),
})

function VolumeTable() {
  const didUnmount = useRef(false)
  const connectedRobot = useSelector(getConnectedRobot)
  const { lastJsonMessage: volumes, readyState } = useWebSocket(
    // `ws://${connectedRobot.ip}:13555/`,
    `ws://192.168.1.181:13555/`,
    {
      shouldReconnect: () => didUnmount.current === false,
      reconnectInterval: 3000,
    }
  )
  useEffect(() => () => (didUnmount.current = true), [])

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState]
  if (!volumes) return connectionStatus

  return (
    <div style={{ padding: 16 }}>
      <strong>Volumes:</strong>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {Object.keys(volumes)
          .sort()
          .map(key => (
            <Fragment key={key}>
              <span>{key}</span>
              <span>{volumes[key].toFixed(2)} μL</span>
            </Fragment>
          ))}
      </div>
    </div>
  )
}

export function RunPanelComponent(props: Props): JSX.Element {
  const { t } = useTranslation('run_details')
  const isNewProtocolRunPanel = useFeatureFlag('preProtocolFlowWithoutRPC')

  return isNewProtocolRunPanel ? (
    <SidePanel title={t('run_protocol')}>
      <RunTimeControl />
      <ModuleLiveStatusCards />
    </SidePanel>
  ) : (
    <SidePanel title="Execute Run">
      <SidePanelGroup>
        <RunTimer />
        <RunControls
          disabled={props.disabled}
          modulesReady={props.modulesReady}
          isReadyToRun={props.isReadyToRun}
          isPaused={props.isPaused}
          isRunning={props.isRunning}
          isBlocked={props.isBlocked}
          onRunClick={props.onRunClick}
          onPauseClick={props.onPauseClick}
          onResumeClick={props.onResumeClick}
          onResetClick={props.onResetClick}
        />
      </SidePanelGroup>
      <ModuleLiveStatusCards />
      <VolumeTable />
    </SidePanel>
  )
}

export const RunPanel = connect(
  mapStateToProps,
  mapDispatchToProps
)(RunPanelComponent)
