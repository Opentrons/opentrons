import { useHealth } from '@opentrons/react-api-client'

// TODO(jh, 10-24-25): We assign magic numbers to high/low disk space thresholds on the app
//  given defaults on the robot-server, but these are not necessarily the tuneable
//  values set on the robot-server.

export const DEFAULT_IMAGE_DIRECTORY_MAX_SIZE_MB = 2048
export const DEFAULT_SYSTEM_LOW_SPACE_THRESHOLD_MB = 250

// A conservative image file size for the ot_system_camera is ~120kb.
const WARNING_BUFFER_MB = 100

export interface RobotStorageInfoLoading {
  isLoading: true
  isImageStorageLow: null
  isSystemStorageLow: null
  imageDirSizeMb: null
  robotDiskAvailableMb: null
}
export interface RobotStorageInfoLoaded {
  isLoading: false
  isImageStorageLow: boolean
  isSystemStorageLow: boolean
  imageDirSizeMb: number
  robotDiskAvailableMb: number
}

export type RobotStorageInfo = RobotStorageInfoLoaded | RobotStorageInfoLoading

/**
 * Storage info for the actively selected robot.
 *
 * On the robot server, system disk storage is considered low when the robot's
 * disk is lower than the `system_low_space_threshold_mb` tuneable value.
 *
 * On the robot server, image storage is considered low when one of the following
 * conditions is met:
 * 1) The /data/images directory disk size is greater than the
 * `images_directory_max_size_mb` tuneable value.
 * 2) The system disk storage is low.
 *
 * This hook utilizes the default values for the aforementioned tuneables
 * and adds a buffer to determine whether to flag storage space as low.
 */
export function useRobotStorageInfo(): RobotStorageInfo {
  const healthData = useHealth()
  const isLoading = healthData == null
  const imageDirSizeMb =
    healthData?.disk_details.imagesDirectorySizeMb ?? Infinity
  const robotDiskAvailableMb =
    healthData?.disk_details.systemAvailableMb ?? Infinity

  const lowImageDirSpace =
    imageDirSizeMb >= DEFAULT_IMAGE_DIRECTORY_MAX_SIZE_MB - WARNING_BUFFER_MB
  const lowRobotDiskSpace =
    robotDiskAvailableMb <=
    DEFAULT_SYSTEM_LOW_SPACE_THRESHOLD_MB + WARNING_BUFFER_MB

  if (isLoading) {
    return {
      isLoading: true,
      isImageStorageLow: null,
      isSystemStorageLow: null,
      imageDirSizeMb: null,
      robotDiskAvailableMb: null,
    }
  } else {
    return {
      isLoading: false,
      isImageStorageLow: lowImageDirSpace || lowRobotDiskSpace,
      isSystemStorageLow: lowRobotDiskSpace,
      imageDirSizeMb: Number(imageDirSizeMb.toFixed(2)),
      robotDiskAvailableMb: Number(robotDiskAvailableMb.toFixed(2)),
    }
  }
}
