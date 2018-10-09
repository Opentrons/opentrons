// @flow
import uuidv1 from 'uuid/v1'

function assignId (): string {
  return uuidv1()
}

export default assignId
