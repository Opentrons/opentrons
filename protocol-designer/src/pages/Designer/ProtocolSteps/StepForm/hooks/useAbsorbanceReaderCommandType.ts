import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  ABSORBANCE_READER_INITIALIZE,
  ABSORBANCE_READER_READ,
} from '/protocol-designer/constants'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import type { AbsorbanceReaderState } from '@opentrons/step-generation'

export function useAbsorbanceReaderCommandType(
  moduleId: string | null
): typeof ABSORBANCE_READER_READ | typeof ABSORBANCE_READER_INITIALIZE | null {
  const robotState = useSelector(getRobotStateAtActiveItem)
  const { labware = {}, modules = {} } = robotState ?? {}
  const isLabwareOnAbsorbanceReader = useMemo(
    () => Object.values(labware).some(lw => lw.stack.includes(moduleId ?? '')),
    [moduleId, labware]
  )
  if (moduleId == null) {
    return null
  }
  const absorbanceReaderState = modules[moduleId]
    ?.moduleState as AbsorbanceReaderState | null
  const initialization = absorbanceReaderState?.initialization ?? null
  const enableReadOrInitialization =
    !isLabwareOnAbsorbanceReader || initialization != null
  const compoundCommandType = isLabwareOnAbsorbanceReader
    ? ABSORBANCE_READER_READ
    : ABSORBANCE_READER_INITIALIZE

  return enableReadOrInitialization ? compoundCommandType : null
}
