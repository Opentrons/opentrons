// @flow

// session steps

export const PREMIGRATION: 'premigration' = 'premigration'
export const PREMIGRATION_RESTART: 'premigrationRestart' = 'premigrationRestart'
export const GET_TOKEN: 'getToken' = 'getToken'
export const UPLOAD_FILE: 'uploadFile' = 'uploadFile'
export const PROCESS_FILE: 'processFile' = 'processFile'
export const COMMIT_UPDATE: 'commitUpdate' = 'commitUpdate'
export const RESTART: 'restart' = 'restart'
export const RESTARTING: 'restarting' = 'restarting'
export const FINISHED: 'finished' = 'finished'

// session stages

export const AWAITING_FILE: 'awaiting-file' = 'awaiting-file'
export const VALIDATING: 'validating' = 'validating'
export const WRITING: 'writing' = 'writing'
export const DONE: 'done' = 'done'
export const READY_FOR_RESTART: 'ready-for-restart' = 'ready-for-restart'
export const ERROR: 'error' = 'error'

// system types

export const BALENA: 'balena' = 'balena'
export const BUILDROOT: 'buildroot' = 'buildroot'

// update types

export const UPGRADE: 'upgrade' = 'upgrade'
export const DOWNGRADE: 'downgrade' = 'downgrade'
export const REINSTALL: 'reinstall' = 'reinstall'

// action types

export const BR_UPDATE_VERSION: 'buildroot:UPDATE_VERSION' =
  'buildroot:UPDATE_VERSION'

export const BR_UPDATE_INFO: 'buildroot:UPDATE_INFO' = 'buildroot:UPDATE_INFO'

export const BR_USER_FILE_INFO: 'buildroot:USER_FILE_INFO' =
  'buildroot:USER_FILE_INFO'

export const BR_DOWNLOAD_PROGRESS: 'buildroot:DOWNLOAD_PROGRESS' =
  'buildroot:DOWNLOAD_PROGRESS'

export const BR_DOWNLOAD_ERROR: 'buildroot:DOWNLOAD_ERROR' =
  'buildroot:DOWNLOAD_ERROR'

export const BR_SET_UPDATE_SEEN: 'buildroot:SET_UPDATE_SEEN' =
  'buildroot:SET_UPDATE_SEEN'

export const BR_CHANGELOG_SEEN: 'buildroot:CHANGELOG_SEEN' =
  'buildroot:CHANGELOG_SEEN'

export const BR_UPDATE_IGNORED: 'buildroot:UPDATE_IGNORED' =
  'buildroot:UPDATE_IGNORED'

export const BR_START_PREMIGRATION: 'buildroot:START_PREMIGRATION' =
  'buildroot:START_PREMIGRATION'

export const BR_PREMIGRATION_DONE: 'buildroot:PREMIGRATION_DONE' =
  'buildroot:PREMIGRATION_DONE'

export const BR_PREMIGRATION_ERROR: 'buildroot:PREMIGRATION_ERROR' =
  'buildroot:PREMIGRATION_ERROR'

export const BR_START_UPDATE: 'buildroot:START_UPDATE' =
  'buildroot:START_UPDATE'

export const BR_CREATE_SESSION: 'buildroot:CREATE_SESSION' =
  'buildroot:CREATE_SESSION'

export const BR_CREATE_SESSION_SUCCESS: 'buildroot:CREATE_SESSION_SUCCESS' =
  'buildroot:CREATE_SESSION_SUCCESS'

export const BR_STATUS: 'buildroot:STATUS' = 'buildroot:STATUS'

export const BR_READ_USER_FILE: 'buildroot:READ_USER_FILE' =
  'buildroot:READ_USER_FILE'

export const BR_UPLOAD_FILE: 'buildroot:UPLOAD_FILE' = 'buildroot:UPLOAD_FILE'

export const BR_FILE_UPLOAD_DONE: 'buildroot:FILE_UPLOAD_DONE' =
  'buildroot:FILE_UPLOAD_DONE'

export const BR_CLEAR_SESSION: 'buildroot:CLEAR_SESSION' =
  'buildroot:CLEAR_SESSION'

export const BR_UNEXPECTED_ERROR: 'buildroot:UNEXPECTED_ERROR' =
  'buildroot:UNEXPECTED_ERROR'

export const BR_SET_SESSION_STEP: 'buildroot:SET_SESSION_STEP' =
  'buildroot:SET_SESSION_STEP'
