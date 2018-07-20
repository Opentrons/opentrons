// @flow
import * as React from 'react'
import {Modal} from '../modals'
import Prompt from './Prompt'

type Props = {
  modulesMissing: boolean,
  onClick: () => mixed,
}

export default function ConnectModulesModal (props: Props) {
  return (
    <Modal>
      <Prompt {...props}/>
    </Modal>
  )
}
