import { useState } from 'react'

import { uuid } from '/protocol-designer/utils'

import { PROFILE_STEP } from '../constants'
import { getDefaultStepData, getInvalidPresavedStepIds } from '../utils'

import type { VacuumProfileStep } from '/protocol-designer/form-types'
import type {
  PresavedVacuumCycleSavePayload,
  VacuumProfileStepItem,
} from '../types'
import type { VacuumMode } from '../utils'

export interface UsePresavedCycleStateArgs {
  orderedProfileStepIds: string[]
  profileStepItemsById: Record<string, VacuumProfileStepItem>
  repetitions: string
  mode: VacuumMode
  onSaveCycle: (data: PresavedVacuumCycleSavePayload) => void
  handleAddCycleStep?: (stepId: string) => void
}

export function usePresavedCycleState(args: UsePresavedCycleStateArgs): {
  localOrderedProfileStepIds: string[]
  localProfileStepItemsById: Record<string, VacuumProfileStepItem>
  localRepetitions: string
  setLocalRepetitions: (value: string | ((prev: string) => string)) => void
  showCycleErrors: boolean
  setShowCycleErrors: (value: boolean) => void
  showRepetitionErrors: boolean
  setShowRepetitionErrors: (value: boolean) => void
  isRepetitionError: boolean
  invalidStepIds: string[]
  defaultStepData: VacuumProfileStep
  handleStepChange: (stepId: string, patch: Partial<VacuumProfileStep>) => void
  handleDeleteStep: (stepId: string) => void
  handleEditStep: (stepId: string) => void
  handleAddStep: () => void
  saveCycle: () => void
  allowDeleteStep: boolean
} {
  const {
    orderedProfileStepIds,
    profileStepItemsById,
    repetitions,
    mode,
    onSaveCycle,
    handleAddCycleStep,
  } = args

  const [localOrderedProfileStepIds, setLocalOrderedProfileStepIds] = useState<
    string[]
  >(orderedProfileStepIds)
  const [localProfileStepItemsById, setLocalProfileStepItemsById] =
    useState<Record<string, VacuumProfileStepItem>>(profileStepItemsById)
  const [localRepetitions, setLocalRepetitions] = useState<string>(repetitions)
  const [showCycleErrors, setShowCycleErrors] = useState<boolean>(false)
  const [showRepetitionErrors, setShowRepetitionErrors] =
    useState<boolean>(false)

  const defaultStepData = getDefaultStepData(mode)
  const isRepetitionError =
    localRepetitions === '' || Number(localRepetitions) < 1
  const invalidStepIds = getInvalidPresavedStepIds(
    localOrderedProfileStepIds,
    localProfileStepItemsById
  )
  const allowDeleteStep = localOrderedProfileStepIds.length > 1

  const handleStepChange = (
    stepId: string,
    patch: Partial<VacuumProfileStep>
  ): void => {
    setLocalProfileStepItemsById(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        ...patch,
        type: PROFILE_STEP,
      },
    }))
  }

  const handleDeleteStep = (stepId: string): void => {
    setLocalOrderedProfileStepIds(prev => prev.filter(id => id !== stepId))
    setLocalProfileStepItemsById(prev =>
      Object.entries(prev).reduce((acc, [key, value]) => {
        if (key === stepId) {
          return acc
        }
        return { ...acc, [key]: value }
      }, {})
    )
    handleAddCycleStep?.(stepId)
  }

  const handleEditStep = (stepId: string): void => {
    setLocalProfileStepItemsById(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        isPresaved: true,
      },
    }))
  }

  const handleAddStep = (): void => {
    const id = uuid()
    const newStep: VacuumProfileStepItem = {
      ...defaultStepData,
      id,
      isPresaved: true,
      type: PROFILE_STEP,
    }
    setLocalOrderedProfileStepIds(prev => [...prev, id])
    setLocalProfileStepItemsById(prev => ({
      ...prev,
      [id]: newStep,
    }))
    handleAddCycleStep?.(id)
  }

  const saveCycle = (): void => {
    if (invalidStepIds.length > 0) {
      setShowCycleErrors(true)
      return
    }
    if (isRepetitionError) {
      setShowRepetitionErrors(true)
      return
    }
    setShowCycleErrors(false)
    setShowRepetitionErrors(false)
    onSaveCycle({
      orderedProfileStepIds: localOrderedProfileStepIds,
      profileStepItemsById: localProfileStepItemsById,
      repetitions: localRepetitions,
    })
  }

  return {
    localOrderedProfileStepIds,
    localProfileStepItemsById,
    localRepetitions,
    setLocalRepetitions,
    showCycleErrors,
    setShowCycleErrors,
    showRepetitionErrors,
    setShowRepetitionErrors,
    isRepetitionError,
    invalidStepIds,
    defaultStepData,
    handleStepChange,
    handleDeleteStep,
    handleEditStep,
    handleAddStep,
    saveCycle,
    allowDeleteStep,
  }
}
