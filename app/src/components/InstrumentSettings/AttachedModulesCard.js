// @flow
// attached modules container card
import * as React from 'react'
import {connect} from 'react-redux'

import type {State} from '../../types'

import {Card} from '@opentrons/components'
import {getModulesOn} from '../../config'
import ModulesCardContents from './ModulesCardContents'

type Module = {
  slot: number,
  name: string,
  status: string,
  serial: number,
  fw_version: string
}

type SP = {
  modulesFlag: ?boolean,
  inProgress?: ?boolean,
  modules?: Array<Module>, // modulesBySlot?
  fetchModules?: () => mixed
}

type Props = SP

const TITLE = 'Modules'

export default connect(mapStateToProps, null)(AttachedModulesCard)

// TODO (ka 2018-6-29): change this to a refresh card once we have endpoints
function AttachedModulesCard (props: Props) {
  if (props.modulesFlag) {
    return (
      <Card
        title={TITLE}
        column
      >
        <ModulesCardContents />
      </Card>
    )
  }
  return null
}

function mapStateToProps (state: State): SP {
  return {
    modulesFlag: getModulesOn(state)
  }
}
