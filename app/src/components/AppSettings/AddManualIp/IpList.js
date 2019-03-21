// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {getConfig, removeManualIp} from '../../../config'

import type {State, Dispatch} from '../../../types'
import type {DiscoveryCandidates} from '../../../config'

import IpItem from './IpItem'

type SP = {|
  candidates: DiscoveryCandidates,
|}

type DP = {|
  removeManualIp: (ip: string) => mixed,
|}

type Props = {...SP, ...DP}

function IpList (props: Props) {
  const {candidates, removeManualIp} = props
  const candidateList = [].concat(candidates)
  return (
    <div>
      {candidateList.map((c, index) => (
        <IpItem candidate={c} key={index} removeIp={removeManualIp} />
      ))}
    </div>
  )
}

export default connect(
  STP,
  DTP
)(IpList)

function STP (state: State): SP {
  return {
    candidates: getConfig(state).discovery.candidates,
  }
}

function DTP (dispatch: Dispatch): DP {
  return {
    removeManualIp: ip => dispatch(removeManualIp(ip)),
  }
}
