import { Fragment } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getConfig, removeManualIp } from '/app/redux/config'
import { getViewableRobots } from '/app/redux/discovery'
import { ManualIpHostnameItem } from './ManualIpHostnameItem'

import type { State, Dispatch } from '/app/redux/types'

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
  const candidates = useSelector((state: State) => {
    const results = getConfig(state)?.discovery.candidates
    return typeof results === 'string' ? [].concat(results) : results
  })

  const robots = useSelector((state: State) => getViewableRobots(state))
  const dispatch = useDispatch<Dispatch>()

  return (
    <>
      {candidates != null && candidates.length > 0
        ? candidates
            .map<[string, boolean]>(candidate => {
              const discovered = robots.some(robot => robot.ip === candidate)
              return [candidate, discovered]
            })
            .sort(([_candidateA, aDiscovered], [_candidateB, bDiscovered]) =>
              bDiscovered && !aDiscovered ? -1 : 1
            )
            .map(([candidate, discovered], index) => (
              <Fragment key={index}>
                <ManualIpHostnameItem
                  candidate={candidate}
                  removeIp={() => dispatch(removeManualIp(candidate))}
                  discovered={discovered}
                  mostRecentAddition={mostRecentAddition}
                  setMostRecentAddition={setMostRecentAddition}
                  setMostRecentDiscovered={setMostRecentDiscovered}
                  isLast={index === candidates.length - 1}
                />
              </Fragment>
            ))
        : null}
    </>
  )
}
