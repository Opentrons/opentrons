import * as React from 'react'
import { connect, MapDispatchToProps } from 'react-redux'
import { getConfig, removeManualIp } from '../../../../redux/config'
import { getViewableRobots } from '../../../../redux/discovery'
import { IpItem } from './IpItem'

import type { State } from '../../../../redux/types'
import type { DiscoveryCandidates } from '../../../../redux/config/types'
import type { Robot, ReachableRobot } from '../../../../redux/discovery/types'

interface SP {
  robots: Array<Robot | ReachableRobot>
  candidates: DiscoveryCandidates
}

interface DP {
  removeManualIp: (ip: string) => unknown
}

type Props = SP & DP

function TempIpListComponent(props: Props): JSX.Element {
  const { candidates, removeManualIp, robots } = props
//   const candidateList: string[] = [].concat(candidates)

  // create a new array  Array<[string ,boolean]>
  // sort the created array by the second element
  // then pickup candidate which is a ip address or hostname
  // display them in the list
  return (
    <div>
        {candidates.map<[string, boolean]>((candidate) => {
      const discovered = robots.some(r => r.ip === candidate)
      return [candidate, discovered]
  })
  .sort(([_candidateA, aDiscovered], [_candidateB, bDiscovered]) => bDiscovered && !aDiscovered ? 1 : -1)
  .map(([candidate, discovered], index) => (
    <IpItem
    candidate={candidate}
    key={index}
    removeIp={removeManualIp}
    discovered={discovered}
  />
  ))}
    </div>
  )
}

function mapStateToProps(state: State): SP {
  return {
    robots: getViewableRobots(state),
    candidates: getConfig(state)?.discovery.candidates ?? [],
  }
}

const mapDispatchToProps: MapDispatchToProps<DP, {}> = dispatch => {
  return {
    removeManualIp: ip => dispatch(removeManualIp(ip)),
  }
}

export const IpList = connect(
  mapStateToProps,
  mapDispatchToProps
)(TempIpListComponent)
