import * as React from 'react'
import { connect } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../../redux/robot'
import { getMissingModules } from '../../../redux/modules'

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
    </SidePanel>
  )
}

export const RunPanel = connect(
  mapStateToProps,
  mapDispatchToProps
)(RunPanelComponent)
