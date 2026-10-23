import { useTranslation } from 'react-i18next'

import {
  BasicButton,
  DIRECTION_COLUMN,
  InputField,
  ListItem,
} from '@opentrons/components'

import { maskToPositiveInteger } from '/protocol-designer/steplist/fieldLevel/processing'

import { PROFILE_CYCLE } from './constants'
import { usePresavedCycleState } from './hooks/usePresavedCycleState'
import { PresavedVacuumHeader } from './PresavedVacuumHeader'
import { PresavedVacuumStep } from './PresavedVacuumStep'
import { SavedVacuumStep } from './SavedVacuumStep'
import styles from './vacuumprofile.module.css'

import type { ReactNode } from 'react'
import type {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
} from '@opentrons/step-generation'
import type {
  PresavedVacuumCycleBaseProps,
  PresavedVacuumCycleSavePayload,
} from './types'

export interface PresavedVacuumCycleProps extends PresavedVacuumCycleBaseProps {
  repetitions: string
  handleSaveCycle: (data: PresavedVacuumCycleSavePayload) => void
  mode: typeof VACUUM_MODE_PRESSURE | typeof VACUUM_MODE_POWER
  handleAddCycleStep?: (stepId: string) => void
}

export function PresavedVacuumCycle(
  props: PresavedVacuumCycleProps
): ReactNode {
  const {
    orderedProfileStepIds,
    profileStepItemsById,
    repetitions,
    displayIndex,
    onDelete,
    handleSaveCycle,
    handleAddCycleStep,
    mode,
  } = props
  const { t } = useTranslation('protocol_steps')

  const {
    localOrderedProfileStepIds,
    localProfileStepItemsById,
    localRepetitions,
    setLocalRepetitions,
    showCycleErrors,
    showRepetitionErrors,
    isRepetitionError,
    invalidStepIds,
    handleStepChange,
    handleDeleteStep,
    handleEditStep,
    handleAddStep,
    saveCycle: onSaveCycle,
    allowDeleteStep,
  } = usePresavedCycleState({
    orderedProfileStepIds,
    profileStepItemsById,
    repetitions,
    mode,
    onSaveCycle: handleSaveCycle,
    handleAddCycleStep,
  })

  return (
    <ListItem
      type="default"
      className={styles.presaved_vacuum_cycle_container}
      flexDirection={DIRECTION_COLUMN}
      padding={0}
    >
      <div className={styles.presaved_vacuum_cycle_content}>
        <PresavedVacuumHeader
          displayIndex={displayIndex}
          variant={PROFILE_CYCLE}
          onDelete={onDelete}
          onSave={onSaveCycle}
        />
        <div className={styles.presaved_content}>
          <ListItem type="default" padding={0}>
            <div className={styles.cycle_steps_list}>
              {localOrderedProfileStepIds.map(
                (stepId: string, stepIndex: number) => {
                  const stepData = localProfileStepItemsById[stepId]
                  if (stepData == null) return null
                  const { id } = stepData
                  return stepData.isPresaved ? (
                    <PresavedVacuumStep
                      key={id}
                      displayIndex={`${displayIndex}.${stepIndex + 1}`}
                      stepData={stepData}
                      onDelete={() => {
                        handleDeleteStep(id)
                      }}
                      onStepChange={handleStepChange}
                      isNested
                      allowDelete={allowDeleteStep}
                      forceShowErrors={
                        showCycleErrors && invalidStepIds.includes(id)
                      }
                    />
                  ) : (
                    <SavedVacuumStep
                      key={id}
                      displayIndex={`${displayIndex}.${stepIndex + 1}`}
                      stepData={stepData}
                      onDelete={() => {
                        handleDeleteStep(id)
                      }}
                      onEdit={() => {
                        handleEditStep(id)
                      }}
                      isNested
                      allowDelete={allowDeleteStep}
                    />
                  )
                }
              )}
              <div className={styles.presaved_vacuum_cycle_add_step_row}>
                <BasicButton onClick={handleAddStep}>
                  {t('vacuum.controls.profile.add_cycle_step')}
                </BasicButton>
              </div>
            </div>
          </ListItem>
          <div className={styles.flex_fill}>
            <InputField
              title={t('vacuum.controls.profile.repetitions')}
              value={localRepetitions}
              onChange={e => {
                setLocalRepetitions(
                  maskToPositiveInteger(e.currentTarget.value)
                )
              }}
              error={
                showRepetitionErrors && isRepetitionError
                  ? t('vacuum.controls.profile.errors.repetitions')
                  : null
              }
            />
          </div>
        </div>
      </div>
    </ListItem>
  )
}
