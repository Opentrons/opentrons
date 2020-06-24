// @flow

import type {
  HealthResponse,
  ServerHealthResponse,
  HealthErrorResponse,
} from '../types'

import * as Types from './types'

export const SERVICE_FOUND: 'mdns:SERVICE_FOUND' = 'mdns:SERVICE_FOUND'
export const HEALTH_POLLED: 'http:HEALTH_POLLED' = 'http:HEALTH_POLLED'
export const ADD_IP_ADDRESS: 'client:ADD_IP_ADDRESS' = 'client:ADD_IP_ADDRESS'
export const REMOVE_IP_ADDRESS: 'client:REMOVE_IP_ADDRESS' =
  'client:REMOVE_IP_ADDRESS'
export const REMOVE_ROBOT: 'client:REMOVE_ROBOT' = 'client:REMOVE_ROBOT'

export const serviceFound = (
  name: string,
  ip: string,
  port: number
): Types.ServiceFoundAction => ({
  type: SERVICE_FOUND,
  payload: { name, ip, port },
})

export const healthPolled = (
  ip: string,
  port: number,
  health: HealthResponse | null,
  serverHealth: ServerHealthResponse | null,
  healthError: HealthErrorResponse | null = null,
  serverHealthError: HealthErrorResponse | null = null
): Types.HealthPolledAction => ({
  type: HEALTH_POLLED,
  payload: { ip, port, health, serverHealth, healthError, serverHealthError },
})

export const addIpAddress = (ip: string): Types.AddIpAddressAction => ({
  type: ADD_IP_ADDRESS,
  payload: { ip },
})

export const removeIpAddress = (ip: string): Types.RemoveIpAddressAction => ({
  type: REMOVE_IP_ADDRESS,
  payload: { ip },
})

export const removeRobot = (name: string): Types.RemoveRobotAction => ({
  type: REMOVE_ROBOT,
  payload: { name },
})
