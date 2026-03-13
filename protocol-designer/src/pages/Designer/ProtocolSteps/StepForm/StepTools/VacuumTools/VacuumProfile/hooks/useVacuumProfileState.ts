import { useState } from 'react'

import { uuid } from '/protocol-designer/utils'

import { PROFILE_CYCLE, PROFILE_STEP } from '../constants'
import { getDefaultStepData } from '../utils'

import type {
  PresavedVacuumCycleSavePayload,
  ProfileCycleItem,
  ProfileItem,
  ProfileStepItem,
  VacuumStepData,
} from '../types'
import type { VacuumMode } from '../utils'

export interface UseVacuumProfileStateArgs {
  orderedProfileIds: string[]
  profileItemsById: Record<string, ProfileItem>
  mode: VacuumMode
}

export function useVacuumProfileState(args: UseVacuumProfileStateArgs): {
  orderedProfileItemIds: string[]
  profileItemsById: Record<string, ProfileItem>
  addStep: () => void
  addCycle: () => void
  deleteStep: (stepId: string) => void
  deleteCycleStep: (cycleId: string, stepId: string) => void
  stepChange: (stepId: string, patch: Partial<VacuumStepData>) => void
  saveStepSuccess: (stepId: string, stepData: VacuumStepData) => void
  editStep: (stepId: string) => void
  saveCycle: (
    cycleId: string,
    cycleItem: ProfileCycleItem,
    data: PresavedVacuumCycleSavePayload
  ) => void
  hasUnsavedPresavedItems: boolean
} {
  const { orderedProfileIds, profileItemsById, mode } = args
  const [orderedProfileItemIds, setOrderedProfileItemIds] =
    useState<string[]>(orderedProfileIds)
  const [itemsById, setItemsById] =
    useState<Record<string, ProfileItem>>(profileItemsById)

  const defaultStepData = getDefaultStepData(mode)

  const addStep = (): void => {
    const id = uuid()
    setOrderedProfileItemIds(prev => [...prev, id])
    const newStep: ProfileStepItem = {
      ...defaultStepData,
      id,
      isPresaved: true,
      type: PROFILE_STEP,
    }
    setItemsById(prev => ({ ...prev, [id]: newStep }))
  }

  const saveStepSuccess = (stepId: string, stepData: VacuumStepData): void => {
    setItemsById(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        ...stepData,
        isPresaved: false,
      },
    }))
  }

  const stepChange = (stepId: string, patch: Partial<VacuumStepData>): void => {
    setItemsById(prev => {
      const current = prev[stepId] as ProfileStepItem | undefined
      if (current?.type !== PROFILE_STEP) return prev
      return {
        ...prev,
        [stepId]: {
          ...current,
          ...patch,
          type: PROFILE_STEP,
        },
      }
    })
  }

  const deleteStep = (stepId: string): void => {
    setOrderedProfileItemIds(prev => prev.filter(id => id !== stepId))
    setItemsById(prev => {
      return Object.entries(prev).reduce((acc, [key, value]) => {
        if (key === stepId) {
          return acc
        }
        return { ...acc, [key]: value }
      }, {})
    })
  }

  const deleteCycleStep = (cycleId: string, stepId: string): void => {
    setItemsById(prev => {
      const cycleItem = prev[cycleId] as ProfileCycleItem | undefined
      if (cycleItem?.type !== PROFILE_CYCLE) return prev
      const nextOrderedIds = cycleItem.orderedProfileStepIds.filter(
        id => id !== stepId
      )
      const nextStepItemsById = Object.entries(
        cycleItem.profileStepItemsById
      ).reduce((acc, [key, value]) => {
        if (key === stepId) {
          return acc
        }
        return { ...acc, [key]: value }
      }, {})
      return {
        ...prev,
        [cycleId]: {
          ...cycleItem,
          orderedProfileStepIds: nextOrderedIds,
          profileStepItemsById: nextStepItemsById,
        },
      }
    })
  }

  const editStep = (stepId: string): void => {
    setItemsById(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        isPresaved: true,
      },
    }))
  }

  const addCycle = (): void => {
    const cycleId = uuid()
    const seedStep = {
      ...defaultStepData,
      id: uuid(),
      isPresaved: true,
      type: PROFILE_STEP,
    }
    setOrderedProfileItemIds(prev => [...prev, cycleId])
    setItemsById(prev => ({
      ...prev,
      [cycleId]: {
        ...seedStep,
        id: cycleId,
        type: PROFILE_CYCLE,
        orderedProfileStepIds: [seedStep.id],
        profileStepItemsById: { [seedStep.id]: seedStep },
        repetitions: 1,
        isPresaved: true,
      },
    }))
  }

  const saveCycle = (
    cycleId: string,
    cycleItem: ProfileCycleItem,
    data: PresavedVacuumCycleSavePayload
  ): void => {
    setItemsById(prev => ({
      ...prev,
      [cycleId]: {
        ...cycleItem,
        orderedProfileStepIds: data.orderedProfileStepIds,
        profileStepItemsById: data.profileStepItemsById,
        repetitions: data.repetitions,
        isPresaved: false,
      },
    }))
  }

  const hasUnsavedPresavedItems = Object.values(itemsById).some(
    item => item.isPresaved
  )

  return {
    orderedProfileItemIds,
    profileItemsById: itemsById,
    addStep,
    addCycle,
    deleteStep,
    deleteCycleStep,
    stepChange,
    saveStepSuccess,
    editStep,
    saveCycle,
    hasUnsavedPresavedItems,
  }
}
