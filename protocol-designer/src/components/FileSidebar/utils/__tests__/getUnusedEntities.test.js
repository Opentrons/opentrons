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
    const paramKey = 'moduleId'
    const commands = {
      step123: {
        moduleId: 'magnet123',
        id: 'step123',
        magnetAction: 'engage',
        engageHeight: '10',
        stepType: 'magnet',
        stepName: 'magnet',
        stepDetails: '',
      },
    }
    const entity = {
      magnet123: {
        id: 'magnet123',
        type: 'tempdeck',
        model: 'GEN1',
      },
      temperature456: {
        id: 'temperature456',
        type: 'tempdeck',
        model: 'GEN1',
      },
    }

    const result = getUnusedEntities(entity, commands, paramKey)

    expect(result).toEqual([
      {
        id: 'temperature456',
        type: 'tempdeck',
        model: 'GEN1',
      },
    ])
  })
})
