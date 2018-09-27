// @flow
// RobotSettings card for robot status
import * as React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {FetchHealthCall, RobotUpdateInfo} from '../../http-api-client'

import {
  fetchHealthAndIgnored,
  makeGetRobotHealth,
  makeGetRobotUpdateInfo,
} from '../../http-api-client'

import {RefreshCard, LabeledValue, OutlineButton} from '@opentrons/components'
import {CardContentQuarter} from '../layout'

type OwnProps = Robot & {
  updateUrl: string,
}

type StateProps = {
  healthRequest: FetchHealthCall,
  updateInfo: RobotUpdateInfo,
}

type DispatchProps = {
  fetchHealth: () => mixed,
}

type Props = OwnProps & StateProps & DispatchProps

const TITLE = 'Information'
const NAME_LABEL = 'Robot Name'
const SERVER_VERSION_LABEL = 'Server version'
const FIRMWARE_VERSION_LABEL = 'Firmware version'

export default connect(makeMapStateToProps, mapDispatchToProps)(InformationCard)

function InformationCard (props: Props) {
  const {
    name,
    updateInfo,
    fetchHealth,
    updateUrl,
    healthRequest: {inProgress, response: health},
  } = props

  const realName = (health && health.name) || name
  const version = (health && health.api_version) || 'Unknown'
  const firmwareVersion = (health && health.fw_version) || 'Unknown'
  const updateText = updateInfo.type || 'Reinstall'

  return (
    <RefreshCard
      watch={name}
      refresh={fetchHealth}
      refreshing={inProgress}
      title={TITLE}
    >
      <CardContentQuarter>
        <LabeledValue
          label={NAME_LABEL}
          value={realName}
        />
      </CardContentQuarter>
      <CardContentQuarter>
        <LabeledValue
          label={SERVER_VERSION_LABEL}
          value={version}
        />
      </CardContentQuarter>
      <CardContentQuarter>
        <LabeledValue
          label={FIRMWARE_VERSION_LABEL}
          value={firmwareVersion}
        />
      </CardContentQuarter>
      <CardContentQuarter>
        <OutlineButton
          Component={Link}
          to={updateUrl}
        >
          {updateText}
        </OutlineButton>
      </CardContentQuarter>
    </RefreshCard>
  )
}

function makeMapStateToProps () {
  const getRobotHealth = makeGetRobotHealth()
  const getUpdateInfo = makeGetRobotUpdateInfo()

  return (state: State, ownProps: OwnProps): StateProps => ({
    healthRequest: getRobotHealth(state, ownProps),
    updateInfo: getUpdateInfo(state, ownProps),
  })
}

function mapDispatchToProps (
  dispatch: Dispatch,
  ownProps: OwnProps
): DispatchProps {
  return {
    fetchHealth: () => dispatch(fetchHealthAndIgnored(ownProps)),
  }
}
