export const SESSION_TYPE_CALIBRATION_HEALTH_CHECK: 'calibrationCheck' =
  'calibrationCheck'
export const SESSION_TYPE_TIP_LENGTH_CALIBRATION: 'tipLengthCalibration' =
  'tipLengthCalibration'
export const SESSION_TYPE_DECK_CALIBRATION: 'deckCalibration' =
  'deckCalibration'
export const SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION: 'pipetteOffsetCalibration' =
  'pipetteOffsetCalibration'

export const SESSION_TYPE_BASIC: 'basic' = 'basic'

export type SessionType =
  | typeof SESSION_TYPE_CALIBRATION_HEALTH_CHECK
  | typeof SESSION_TYPE_TIP_LENGTH_CALIBRATION
  | typeof SESSION_TYPE_DECK_CALIBRATION
  | typeof SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
  | typeof SESSION_TYPE_BASIC

interface CalibrationCheckSession {
  id: string
  sessionType: typeof SESSION_TYPE_CALIBRATION_HEALTH_CHECK
  createParams: Record<string, unknown>
}

interface TipLengthCalibrationSession {
  id: string
  sessionType: typeof SESSION_TYPE_TIP_LENGTH_CALIBRATION
  createParams: Record<string, unknown>
}

interface DeckCalibrationSession {
  id: string
  sessionType: typeof SESSION_TYPE_DECK_CALIBRATION
  createParams: {}
}

interface PipetteOffsetCalibrationSession {
  id: string
  sessionType: typeof SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
  createParams: Record<string, unknown>
}

interface BasicSession {
  id: string
  sessionType: typeof SESSION_TYPE_BASIC
  createParams: Record<string, unknown>
}

export type SessionData =
  | CalibrationCheckSession
  | TipLengthCalibrationSession
  | DeckCalibrationSession
  | PipetteOffsetCalibrationSession
  | BasicSession

interface ResourceLink {
  href: string
  meta?: Partial<{ [key: string]: string | null | undefined }>
}

type ResourceLinks = Record<string, ResourceLink | string | null | undefined>

export interface Session {
  data: SessionData
  links?: ResourceLinks
}

export interface Sessions {
  data: SessionData[]
  links?: ResourceLinks
}
