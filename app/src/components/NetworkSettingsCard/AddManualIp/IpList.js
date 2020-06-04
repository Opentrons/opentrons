// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { getConfig, removeManualIp } from '../../../config'
import { getViewableRobots } from '../../../discovery'
import { IpItem } from './IpItem'

import type { State, Dispatch } from '../../../types'
import type { DiscoveryCandidates } from '../../../config/types'
import type { Robot, ReachableRobot } from '../../../discovery/types'

type OP = {||}

type SP = {|
  robots: Array<Robot | ReachableRobot>,
  candidates: DiscoveryCandidates,
|}

type DP = {|
  removeManualIp: (ip: string) => mixed,
|}

type Props = {| ...SP, ...DP |}

function IpListComponent(props: Props) {
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
    robots: getViewableRobots(state),
    candidates: getConfig(state).discovery.candidates,
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    removeManualIp: ip => dispatch(removeManualIp(ip)),
  }
}

export const IpList: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  DP,
  State,
  Dispatch
>(
  mapStateToProps,
  mapDispatchToProps
)(IpListComponent)
