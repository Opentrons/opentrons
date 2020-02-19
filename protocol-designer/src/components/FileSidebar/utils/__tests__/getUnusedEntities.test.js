// @flow

import { getUnusedEntities } from '../'

describe('getUnusedEntities', () => {
  test('pipette entities not used in steps are returned', () => {
    const commands = {
      step123: {
        pipette: 'pipette123',
        id: 'step123',
      },
    }
    const paramKey = 'pipette'
    const entity = {
      pipette123: {
        name: 'pipette 123',
        id: 'pipette123',
        mount: 'right',
      },
      pipette456: {
        name: 'pipette 456',
        id: 'pipette456',
        mount: 'left',
      },
    }

    const result = getUnusedEntities(entity, commands, paramKey)

    expect(result).toEqual([
      {
        name: 'pipette 456',
        id: 'pipette456',
        mount: 'left',
      },
    ])
  })

  test('module entities not used in steps are returned', () => {
    const commands = {
      step123: {
        moduleId: 'module123',
        id: 'step123',
      },
    }
    const paramKey = 'pipette'
    const entity = {
      pipette123: {
        name: 'pipette 123',
        id: 'pipette123',
        mount: 'right',
      },
      pipette456: {
        name: 'pipette 456',
        id: 'pipette456',
        mount: 'left',
      },
    }

    const result = getUnusedEntities(entity, commands, paramKey)

    expect(result).toEqual([
      {
        name: 'pipette 456',
        id: 'pipette456',
        mount: 'left',
      },
    ])
  })
})
