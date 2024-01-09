// session steps

export const PREMIGRATION: 'premigration' = 'premigration'
export const PREMIGRATION_RESTART: 'premigrationRestart' = 'premigrationRestart'
export const DOWNLOAD_FILE: 'downloadFile' = 'downloadFile'
export const GET_TOKEN: 'getToken' = 'getToken'
export const UPLOAD_FILE: 'uploadFile' = 'uploadFile'
export const PROCESS_FILE: 'processFile' = 'processFile'
export const COMMIT_UPDATE: 'commitUpdate' = 'commitUpdate'
export const RESTART: 'restart' = 'restart'
export const FINISHED: 'finished' = 'finished'

// session stages

export const AWAITING_FILE: 'awaiting-file' = 'awaiting-file'
export const VALIDATING: 'validating' = 'validating'
export const WRITING: 'writing' = 'writing'
export const DONE: 'done' = 'done'
export const READY_FOR_RESTART: 'ready-for-restart' = 'ready-for-restart'
export const ERROR: 'error' = 'error'

// system types

export const OT2_BALENA: 'ot2-balena' = 'ot2-balena'
export const OT2_BUILDROOT: 'ot2-buildroot' = 'ot2-buildroot'
export const FLEX: 'flex' = 'flex'

// update types

export const UPGRADE: 'upgrade' = 'upgrade'
export const DOWNGRADE: 'downgrade' = 'downgrade'
export const REINSTALL: 'reinstall' = 'reinstall'

// action types

export const ROBOTUPDATE_CHECKING_FOR_UPDATE: 'robotUpdate:CHECKING_FOR_UPDATE' =
  'robotUpdate:CHECKING_FOR_UPDATE'

export const ROBOTUPDATE_UPDATE_VERSION: 'robotUpdate:UPDATE_VERSION' =
  'robotUpdate:UPDATE_VERSION'

export const ROBOTUPDATE_UPDATE_INFO: 'robotUpdate:UPDATE_INFO' =
  'robotUpdate:UPDATE_INFO'

export const ROBOTUPDATE_FILE_INFO: 'robotUpdate:FILE_INFO' =
  'robotUpdate:FILE_INFO'

export const ROBOTUPDATE_DOWNLOAD_PROGRESS: 'robotUpdate:DOWNLOAD_PROGRESS' =
  'robotUpdate:DOWNLOAD_PROGRESS'

export const ROBOTUPDATE_DOWNLOAD_ERROR: 'robotUpdate:DOWNLOAD_ERROR' =
  'robotUpdate:DOWNLOAD_ERROR'

export const ROBOTUPDATE_DOWNLOAD_DONE: 'robotUpdate:DOWNLOAD_DONE' =
  'robotUpdate:DOWNLOAD_DONE'

export const ROBOTUPDATE_SET_UPDATE_SEEN: 'robotUpdate:SET_UPDATE_SEEN' =
  'robotUpdate:SET_UPDATE_SEEN'

export const ROBOTUPDATE_CHANGELOG_SEEN: 'robotUpdate:CHANGELOG_SEEN' =
  'robotUpdate:CHANGELOG_SEEN'

export const ROBOTUPDATE_UPDATE_IGNORED: 'robotUpdate:UPDATE_IGNORED' =
  'robotUpdate:UPDATE_IGNORED'

export const ROBOTUPDATE_START_PREMIGRATION: 'robotUpdate:START_PREMIGRATION' =
  'robotUpdate:START_PREMIGRATION'

export const ROBOTUPDATE_PREMIGRATION_DONE: 'robotUpdate:PREMIGRATION_DONE' =
  'robotUpdate:PREMIGRATION_DONE'

export const ROBOTUPDATE_PREMIGRATION_ERROR: 'robotUpdate:PREMIGRATION_ERROR' =
  'robotUpdate:PREMIGRATION_ERROR'

export const ROBOTUPDATE_START_UPDATE: 'robotUpdate:START_UPDATE' =
  'robotUpdate:START_UPDATE'

export const ROBOTUPDATE_CREATE_SESSION: 'robotUpdate:CREATE_SESSION' =
  'robotUpdate:CREATE_SESSION'

export const ROBOTUPDATE_CREATE_SESSION_SUCCESS: 'robotUpdate:CREATE_SESSION_SUCCESS' =
  'robotUpdate:CREATE_SESSION_SUCCESS'

export const ROBOTUPDATE_STATUS: 'robotUpdate:STATUS' = 'robotUpdate:STATUS'

export const ROBOTUPDATE_READ_USER_FILE: 'robotUpdate:READ_USER_FILE' =
  'robotUpdate:READ_USER_FILE'

export const ROBOTUPDATE_READ_SYSTEM_FILE: 'robotUpdate:READ_SYSTEM_FILE' =
  'robotUpdate:READ_SYSTEM_FILE'

export const ROBOTUPDATE_UPLOAD_FILE: 'robotUpdate:UPLOAD_FILE' =
  'robotUpdate:UPLOAD_FILE'

export const ROBOTUPDATE_FILE_UPLOAD_DONE: 'robotUpdate:FILE_UPLOAD_DONE' =
  'robotUpdate:FILE_UPLOAD_DONE'

export const ROBOTUPDATE_CLEAR_SESSION: 'robotUpdate:CLEAR_SESSION' =
  'robotUpdate:CLEAR_SESSION'

export const ROBOTUPDATE_UNEXPECTED_ERROR: 'robotUpdate:UNEXPECTED_ERROR' =
  'robotUpdate:UNEXPECTED_ERROR'

export const ROBOTUPDATE_SET_SESSION_STEP: 'robotUpdate:SET_SESSION_STEP' =
  'robotUpdate:SET_SESSION_STEP'

export const ROBOTUPDATE_FILE_UPLOAD_PROGRESS: 'robotUpdate:FILE_UPLOAD_PROGRESS' =
  'robotUpdate:FILE_UPLOAD_PROGRESS'
