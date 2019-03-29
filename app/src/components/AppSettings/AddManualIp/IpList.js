// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import find from 'lodash/find'
import {getConfig, removeManualIp} from '../../../config'
import {getConnectableRobots, getReachableRobots} from '../../../discovery'

import type {State, Dispatch} from '../../../types'
import type {DiscoveryCandidates} from '../../../config'
import type {Robot, ReachableRobot} from '../../../discovery'

import IpItem from './IpItem'

type SP = {|
  connectableRobots: Array<Robot>,
  reachableRobots: Array<ReachableRobot>,
  candidates: DiscoveryCandidates,
|}

type DP = {|
  removeManualIp: (ip: string) => mixed,
|}

type Props = {...SP, ...DP}

function IpList (props: Props) {
  const {candidates, removeManualIp, connectableRobots, reachableRobots} = props
  const candidateList = [].concat(candidates)
  const robots = connectableRobots.concat(reachableRobots)
  console.log(robots)
  return (
    <div>
      {candidateList.map((c, index) => {
        const discovered = !!find(robots, r => r.ip === c)
        return (
          <IpItem
            candidate={c}
            key={index}
            removeIp={removeManualIp}
            discovered={discovered}
          />
        )
      })}
    </div>
  )
}

export default connect(
  STP,
  DTP
)(IpList)

function STP (state: State): SP {
  return {
    connectableRobots: getConnectableRobots(state),
    reachableRobots: getReachableRobots(state),
    candidates: getConfig(state).discovery.candidates,
  }
}

function DTP (dispatch: Dispatch): DP {
  return {
    removeManualIp: ip => dispatch(removeManualIp(ip)),
  }
}
