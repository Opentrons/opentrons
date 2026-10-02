import axios from 'axios'

const MAINTENANCE_COMMAND_DOOR_OPEN = 'MaintenanceCommandDoorOpen'

// True when a maintenance run command was rejected because the robot's
// front door is open.
export function isMaintenanceDoorOpenError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 409 &&
    error.response?.data?.errors?.[0]?.id === MAINTENANCE_COMMAND_DOOR_OPEN
  )
}

export function isMovementError(error: Error): boolean {
  return (
    // robotics control error
    error.cause === '2000' ||
    // motion failed
    error.cause === '2001' ||
    // homing failed
    error.cause === '2002' ||
    // motion planning failure
    error.cause === '2004' ||
    // position estimation invalid
    error.cause === '2005' ||
    // move condition not met
    error.cause === '2006' ||
    // motor driver error
    error.cause === '2016'
  )
}

export function isTipPresenceError(error: Error): boolean {
  return error.cause === '3005'
}
