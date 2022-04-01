import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getConfig, removeManualIp } from '../../redux/config'
import { getViewableRobots } from '../../redux/discovery'
import { IpHostnameItem } from './IpHostnameItem'

import type { State, Dispatch } from '../../redux/types'

interface Props {
  mostRecentAddition: string | null
}

export function IpHostnameList(props: Props): JSX.Element {
  const candidates = useSelector(
    (state: State) => getConfig(state)?.discovery.candidates ?? []
  )
  const robots = useSelector((state: State) => getViewableRobots(state))
  const dispatch = useDispatch<Dispatch>()

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
            key={index}
            removeIp={() => dispatch(removeManualIp(candidate))}
            discovered={discovered}
            justAdded={candidate === props.mostRecentAddition}
            isLast={index === candidates.length - 1}
          />
        ))}
    </>
  )
}
