import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getConfig, removeManualIp } from '../../redux/config'
import { getViewableRobots } from '../../redux/discovery'
import { ManualIpHostnameItem } from './ManualIpHostnameItem'

import type { State, Dispatch } from '../../redux/types'

interface IpHostnameListProps {
  mostRecentAddition: string | null
  setMostRecentAddition: (ip: string | null) => void
  setMostRecentDiscovered: (discovered: boolean) => void
}

export function ManualIpHostnameList({
  mostRecentAddition,
  setMostRecentAddition,
  setMostRecentDiscovered,
}: IpHostnameListProps): JSX.Element {
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
          <ManualIpHostnameItem
            candidate={candidate}
            key={index}
            removeIp={() => dispatch(removeManualIp(candidate))}
            discovered={discovered}
            mostRecentAddition={mostRecentAddition}
            setMostRecentAddition={setMostRecentAddition}
            setMostRecentDiscovered={setMostRecentDiscovered}
            isLast={index === candidates.length - 1}
          />
        ))}
    </>
  )
}
