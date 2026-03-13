import { useState } from 'react'

import { uuid } from '/protocol-designer/utils'

import { PROFILE_STEP } from '../constants'
import { getDefaultStepData, getInvalidPresavedStepIds } from '../utils'

import type {
  PresavedVacuumCycleSavePayload,
  ProfileStepItem,
  VacuumStepData,
} from '../types'
import type { VacuumMode } from '../utils'

export interface UsePresavedCycleStateArgs {
  orderedProfileStepIds: string[]
  profileStepItemsById: Record<string, ProfileStepItem>
  repetitions: number
  mode: VacuumMode | undefined
  onSaveCycle: (data: PresavedVacuumCycleSavePayload) => void
  onRepetitionsError?: () => void
  handleAddCycleStep?: (stepId: string) => void
}

export function usePresavedCycleState(args: UsePresavedCycleStateArgs): {
  localOrderedProfileStepIds: string[]
  localProfileStepItemsById: Record<string, ProfileStepItem>
  localRepetitions: number
  setLocalRepetitions: (value: number | ((prev: number) => number)) => void
  showCycleErrors: boolean
  setShowCycleErrors: (value: boolean) => void
  showRepetitionErrors: boolean
  setShowRepetitionErrors: (value: boolean) => void
  isRepetitionError: boolean
  invalidStepIds: string[]
  defaultStepData: VacuumStepData
  handleStepChange: (stepId: string, patch: Partial<VacuumStepData>) => void
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
    onRepetitionsError,
    handleAddCycleStep,
  } = args

  const [localOrderedProfileStepIds, setLocalOrderedProfileStepIds] = useState<
    string[]
  >(orderedProfileStepIds)
  const [localProfileStepItemsById, setLocalProfileStepItemsById] =
    useState<Record<string, ProfileStepItem>>(profileStepItemsById)
  const [localRepetitions, setLocalRepetitions] = useState<number>(repetitions)
  const [showCycleErrors, setShowCycleErrors] = useState<boolean>(false)
  const [showRepetitionErrors, setShowRepetitionErrors] =
    useState<boolean>(false)

  const defaultStepData = getDefaultStepData(mode)
  const isRepetitionError = localRepetitions == null || localRepetitions < 1
  const invalidStepIds = getInvalidPresavedStepIds(
    localOrderedProfileStepIds,
    localProfileStepItemsById
  )
  const allowDeleteStep = localOrderedProfileStepIds.length > 1

  const handleStepChange = (
    stepId: string,
    patch: Partial<VacuumStepData>
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
    const newStep: ProfileStepItem = {
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
      onRepetitionsError?.()
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
