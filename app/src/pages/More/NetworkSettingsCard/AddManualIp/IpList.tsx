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

function IpListComponent(props: Props): JSX.Element {
  const { candidates, removeManualIp, robots } = props
  // @ts-expect-error TODO: candidates is expected to be string[] here, but type allows for string as well
  const candidateList: string[] = [].concat(candidates)

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

const mapDispatchToProps: MapDispatchToProps<DP, {}> = dispatch => {
  return {
    removeManualIp: ip => dispatch(removeManualIp(ip)),
  }
}

export const IpList = connect(
  mapStateToProps,
  mapDispatchToProps
)(IpListComponent)
