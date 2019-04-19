// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { getConfig, removeManualIp } from '../../../config'
import { getLiveRobots } from '../../../discovery'

import type { State, Dispatch } from '../../../types'
import type { DiscoveryCandidates } from '../../../config'
import type { Robot, ReachableRobot } from '../../../discovery'

import IpItem from './IpItem'

type OP = {||}

type SP = {|
  robots: Array<Robot | ReachableRobot>,
  candidates: DiscoveryCandidates,
|}

type DP = {|
  removeManualIp: (ip: string) => mixed,
|}

type Props = { ...SP, ...DP }

function IpList(props: Props) {
  const { candidates, removeManualIp, robots } = props
  const candidateList = [].concat(candidates)

  return (
    <div>
      {candidateList.map((c, index) => {
        const discovered = robots.some(r => r.ip === c)

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

function mapStateToProps(state: State): SP {
  return {
    robots: getLiveRobots(state),
    candidates: getConfig(state).discovery.candidates,
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    removeManualIp: ip => dispatch(removeManualIp(ip)),
  }
}

export default connect<Props, OP, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps
)(IpList)
