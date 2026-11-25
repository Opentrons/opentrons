import { useTranslation } from 'react-i18next'

import {
  EmptySelectorButton,
  InfoScreen,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
} from '@opentrons/components'

import { useKitchen } from '/protocol-designer/components/organisms/Kitchen/useKitchen'

import { PROFILE_CYCLE, PROFILE_STEP } from './constants'
import { useVacuumProfileState } from './hooks/useVacuumProfileState'
import { PresavedVacuumCycle } from './PresavedVacuumCycle'
import { PresavedVacuumStep } from './PresavedVacuumStep'
import { SavedVacuumCycle } from './SavedVacuumCycle'
import { SavedVacuumStep } from './SavedVacuumStep'
import styles from './vacuumprofile.module.css'

import type { ReactNode } from 'react'
import type {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
} from '@opentrons/step-generation'
import type { FormData, VacuumProfileStep } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../../types'
import type { VacuumProfileCycleItem, VacuumProfileStepItem } from './types'

export interface VacuumProfileModalProps {
  formData: FormData
  propsForFields: FieldPropsByName
  mode: typeof VACUUM_MODE_PRESSURE | typeof VACUUM_MODE_POWER
  onClose: () => void
}

export function VacuumProfileModal(props: VacuumProfileModalProps): ReactNode {
  const { formData, propsForFields, mode, onClose } = props
  const { vacuumOrderedProfileIds, vacuumProfileItemsById } = formData
  const { t } = useTranslation('protocol_steps')
  const { makeSnackbar } = useKitchen()

  const {
    orderedProfileItemIds: localOrderedProfileItemIds,
    profileItemsById: localProfileItemsById,
    addStep: handleAddStep,
    addCycle: handleAddCycle,
    deleteStep: handleDeleteStep,
    deleteCycleStep: handleDeleteCycleStep,
    stepChange: handleStepChange,
    saveStepSuccess: onSaveSuccess,
    editStep: handleEditStep,
    saveCycle: handleSaveCycle,
    hasUnsavedPresavedItems,
  } = useVacuumProfileState({
    vacuumOrderedProfileIds,
    vacuumProfileItemsById,
    mode,
  })

  const handleSaveModal = (): void => {
    if (localOrderedProfileItemIds.length === 0) {
      makeSnackbar(t('vacuum.controls.profile.no_steps_defined') as string)
      return
    }
    if (hasUnsavedPresavedItems) {
      makeSnackbar(t('vacuum.controls.profile.unsaved_changes') as string)
      return
    }
    propsForFields.vacuumProfileItemsById.updateValue(localProfileItemsById)
    propsForFields.vacuumOrderedProfileIds.updateValue(
      localOrderedProfileItemIds
    )
    onClose()
  }

  const footer = (
    <div className={styles.vacuum_profile_modal_footer}>
      <SecondaryButton onClick={onClose}>
        {t('vacuum.controls.profile.cancel')}
      </SecondaryButton>
      <PrimaryButton onClick={handleSaveModal}>
        {t('vacuum.controls.profile.save')}
      </PrimaryButton>
    </div>
  )

  return (
    <Modal
      title={t('vacuum.controls.profile.title')}
      width="45rem"
      maxHeight="45rem"
      childrenPadding={SPACING.spacing24}
      onClose={onClose}
      footer={footer}
    >
      <div className={styles.vacuum_profile_modal_body}>
        <div className={styles.vacuum_profile_modal_actions}>
          <div className={styles.empty_selector_button_container}>
            <EmptySelectorButton
              text={t('vacuum.controls.profile.add_step')}
              textAlignment="left"
              iconName="plus"
              onClick={handleAddStep}
            />
          </div>
          <div className={styles.empty_selector_button_container}>
            <EmptySelectorButton
              text={t('vacuum.controls.profile.add_cycle')}
              textAlignment="left"
              iconName="plus"
              onClick={handleAddCycle}
            />
          </div>
        </div>
        {localOrderedProfileItemIds.length === 0 ? (
          <InfoScreen
            content={t('vacuum.controls.profile.no_steps_defined')}
            height="27.625rem"
          />
        ) : (
          <div className={styles.vacuum_profile_modal_list}>
            {localOrderedProfileItemIds.map((id: string, index: number) => {
              const profileItem = localProfileItemsById[id]
              if (profileItem.type === PROFILE_STEP) {
                const stepItem = profileItem as VacuumProfileStepItem
                return stepItem.isPresaved ? (
                  <PresavedVacuumStep
                    key={id}
                    displayIndex={String(index + 1)}
                    stepData={stepItem}
                    onSaveSuccess={(stepData: VacuumProfileStep) => {
                      onSaveSuccess(id, stepData)
                    }}
                    onStepChange={(_stepId, patch) => {
                      handleStepChange(id, patch)
                    }}
                    onDelete={() => {
                      handleDeleteStep(id)
                    }}
                  />
                ) : (
                  <SavedVacuumStep
                    key={id}
                    displayIndex={String(index + 1)}
                    stepData={stepItem}
                    onDelete={() => {
                      handleDeleteStep(id)
                    }}
                    onEdit={() => {
                      handleEditStep(id)
                    }}
                  />
                )
              } else {
                const cycleItem = profileItem as VacuumProfileCycleItem
                return profileItem.isPresaved ? (
                  <PresavedVacuumCycle
                    key={id}
                    displayIndex={String(index + 1)}
                    orderedProfileStepIds={cycleItem.orderedProfileStepIds}
                    profileStepItemsById={cycleItem.profileStepItemsById}
                    repetitions={cycleItem.repetitions}
                    onDelete={() => {
                      handleDeleteStep(id)
                    }}
                    handleSaveCycle={data => {
                      handleSaveCycle(id, cycleItem, data)
                    }}
                    type={PROFILE_CYCLE}
                    mode={mode}
                  />
                ) : (
                  <SavedVacuumCycle
                    key={id}
                    cycleId={id}
                    displayIndex={String(index + 1)}
                    orderedProfileStepIds={cycleItem.orderedProfileStepIds}
                    profileStepItemsById={cycleItem.profileStepItemsById}
                    onEdit={handleEditStep}
                    onDeleteStep={stepId => {
                      handleDeleteCycleStep(id, stepId)
                    }}
                    type={PROFILE_CYCLE}
                    onDelete={() => {
                      handleDeleteStep(id)
                    }}
                    repetitions={cycleItem.repetitions}
                  />
                )
              }
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
