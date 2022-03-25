import * as React from 'react'
import { connect, MapDispatchToProps } from 'react-redux'
import { getConfig, removeManualIp } from '../../redux/config'
import { getViewableRobots } from '../../redux/discovery'
import { IpHostnameItem } from './IpHostnameItem'

import type { State } from '../../redux/types'
import type { DiscoveryCandidates } from '../../redux/config/types'
import type { Robot, ReachableRobot } from '../../redux/discovery/types'

interface SP {
  robots: Array<Robot | ReachableRobot>
  candidates: DiscoveryCandidates
}

interface DP {
  removeManualIp: (ip: string) => unknown
}

type Props = SP & DP & { mostRecentAddition: string | null }

function IpHostnameListComponent(props: Props): JSX.Element {
  const { candidates, removeManualIp, robots } = props

  return (
    <>
      {candidates
        .map<[string, boolean]>(candidate => {
          const discovered = robots.some(robot => robot.ip === candidate)
          return [candidate, discovered]
        })
        .sort(([_candidateA, aDiscovered], [_candidateB, bDiscovered]) =>
          bDiscovered && !aDiscovered ? -1 : 1
        )
        .map(([candidate, discovered], index) => (
          <IpHostnameItem
            candidate={candidate}
            key={`ip-${index}`}
            removeIp={removeManualIp}
            discovered={discovered}
            justAdded={candidate === props.mostRecentAddition}
          />
        ))}
    </>
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

export const IpHostnameList = connect(
  mapStateToProps,
  mapDispatchToProps
)(IpHostnameListComponent)
