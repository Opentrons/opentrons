import type { Mount } from '@opentrons/api-client'
import type { LabwareDefinition } from '@opentrons/shared-data'
import type {
  CalibrationCheckComparisonByPipette,
  CalibrationCheckInstrument,
  CalibrationLabware,
  CalibrationSessionStep,
  SessionCommandParams,
  SessionCommandString,
  SessionType,
} from '/app/redux/sessions/types'

// TODO (lc 10-20-2020) Given there are lots of optional
// keys here now we should split these panel props out
// into different session types and combine them into
// a union object
export interface CalibrationPanelProps {
  sendCommands: (...params: SessionCommandParams[]) => void
  cleanUpAndExit: () => void
  tipRack: CalibrationLabware
  isMulti: boolean
  mount: Mount
  currentStep: CalibrationSessionStep
  sessionType: SessionType
  calBlock?: CalibrationLabware | null
  checkBothPipettes?: boolean | null
  instruments?: CalibrationCheckInstrument[] | null
  comparisonsByPipette?: CalibrationCheckComparisonByPipette | null
  activePipette?: CalibrationCheckInstrument
  robotName?: string | null
  supportedCommands?: SessionCommandString[] | null
  defaultTipracks?: LabwareDefinition[] | null
  calInvalidationHandler?: () => void
  allowChangeTipRack?: boolean
}
