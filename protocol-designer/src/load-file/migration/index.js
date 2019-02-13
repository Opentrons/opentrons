// @flow

import flow from 'lodash/flow'
import type {ProtocolFile} from '../../file-types'
import migrationV1 from './migrationV1'

const masterMigration = (file: any): ProtocolFile => (
  flow([
    migrationV1,
  ])(file)
)

export default masterMigration
