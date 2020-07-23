// @flow

import * as Actions from '../actions'

describe('discovery client action creators', () => {
  it('should create a client:INITIALIZE_STATE action with robots in the payload', () => {
    const action = Actions.initializeState({
      initialRobots: [
        {
          name: 'opentrons-dev',
          health: null,
          serverHealth: null,
          addresses: [],
        },
      ],
    })

    expect(action).toEqual({
      type: 'client:INITIALIZE_STATE',
      payload: {
        initialRobots: [
          {
            name: 'opentrons-dev',
            health: null,
            serverHealth: null,
            addresses: [],
          },
        ],
      },
    })
  })

  it('should create a client:INITIALIZE_STATE action with manualAddresses in the payload', () => {
    const action = Actions.initializeState({
      manualAddresses: [{ ip: '127.0.0.1', port: 31950 }],
    })

    expect(action).toEqual({
      type: 'client:INITIALIZE_STATE',
      payload: { manualAddresses: [{ ip: '127.0.0.1', port: 31950 }] },
    })
  })

  it('should create an mdns:SERVICE_FOUND action', () => {
    const action = Actions.serviceFound({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
    })

    expect(action).toEqual({
      type: 'mdns:SERVICE_FOUND',
      payload: { name: 'opentrons-dev', ip: '127.0.0.1', port: 31950 },
    })
  })

  it('should create an http:HEALTH_POLLED action for successful polls', () => {
    const health = {
      name: 'opentrons-dev',
      api_version: '1.2.3',
      fw_version: '4.5.6',
      system_version: '7.8.9',
    }
    const serverHealth = {
      name: 'opentrons-dev',
      apiServerVersion: '1.2.3',
      updateServerVersion: '1.2.3',
      smoothieVersion: '4.5.6',
      systemVersion: '7.8.9',
    }

    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health,
      serverHealth,
      healthError: null,
      serverHealthError: null,
    })

    expect(action).toEqual({
      type: 'http:HEALTH_POLLED',
      payload: {
        ip: '127.0.0.1',
        port: 31950,
        health,
        serverHealth,
        healthError: null,
        serverHealthError: null,
      },
    })
  })

  it('should create an http:HEALTH_POLLED action for unsuccessful polls', () => {
    const healthError = {
      status: 400,
      body: { message: 'ahh' },
    }
    const serverHealthError = {
      status: 504,
      body: 'this is some NGNIX error',
    }

    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: null,
      serverHealth: null,
      healthError,
      serverHealthError,
    })

    expect(action).toEqual({
      type: 'http:HEALTH_POLLED',
      payload: {
        ip: '127.0.0.1',
        port: 31950,
        health: null,
        serverHealth: null,
        healthError,
        serverHealthError,
      },
    })
  })

  it('should allow the user to manually remove a robot from the client', () => {
    const action = Actions.removeRobot('opentrons-dev')

    expect(action).toEqual({
      type: 'client:REMOVE_ROBOT',
      payload: { name: 'opentrons-dev' },
    })
  })
})
