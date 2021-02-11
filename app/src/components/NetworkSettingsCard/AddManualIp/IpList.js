// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { getConfig, removeManualIp } from '../../../redux/config'
import { getViewableRobots } from '../../../redux/discovery'
import { IpItem } from './IpItem'

import type { State, Dispatch } from '../../../redux/types'
import type { DiscoveryCandidates } from '../../../redux/config/types'
import type { Robot, ReachableRobot } from '../../../redux/discovery/types'

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
  const candidateList: Array<string> = [].concat(candidates)

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
    candidates: getConfig(state)?.discovery.candidates ?? [],
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
