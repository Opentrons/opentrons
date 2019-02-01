// @flow

import flow from 'lodash/flow'
import type {ProtocolFile} from '../../file-types'
import mig1 from './mig1_2019-2-1'

const masterMigration = (file: any): ProtocolFile => flow([
  mig1,
])

export default masterMigration
