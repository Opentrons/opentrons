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
  return error.cause === '2001'
}

export function isTipPresenceError(error: Error): boolean {
  return error.cause === '2002'
}
