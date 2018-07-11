// @flow
// attached modules container card
import * as React from 'react'
import {connect} from 'react-redux'

import type {State} from '../../types'
import type {Module} from '../../http-api-client'
import {Card} from '@opentrons/components'
import {getModulesOn} from '../../config'
import ModulesCardContents from './ModulesCardContents'

type SP = {
  modulesFlag: ?boolean,
  inProgress?: ?boolean,
  modules?: Array<Module>,
  fetchModules?: () => mixed
}

type Props = SP

const TITLE = 'Modules'

const STUBBED_MODULE_DATA = [
  {
    name: 'temp_deck',
    model: 'temp_deck',
    serial: '123123124',
    fwVersion: '1.2.13',
    status: '86',
    displayName: 'Temperature Module'
  },
  {
    name: 'mag_deck',
    model: 'mag_deck',
    serial: '123123124',
    fwVersion: '1.2.13',
    status: 'disengaged',
    displayName: 'Magnetic Bead Module'
  }
]
export default connect(mapStateToProps, null)(AttachedModulesCard)

// TODO (ka 2018-6-29): change this to a refresh card once we have endpoints
function AttachedModulesCard (props: Props) {
  if (props.modulesFlag) {
    return (
      <Card
        title={TITLE}
        column
      >
        <ModulesCardContents {...props}/>
      </Card>
    )
  }
  return null
}

function mapStateToProps (state: State): SP {
  return {
    modulesFlag: getModulesOn(state),
    modules: STUBBED_MODULE_DATA
  }
}
