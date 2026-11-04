import { useTranslation } from 'react-i18next'

import {
  BasicButton,
  Icon,
  ListItem,
  StyledText,
  Tag,
} from '@opentrons/components'

import { SavedVacuumStep } from './SavedVacuumStep'
import styles from './vacuumprofile.module.css'

import type { VacuumCycleBaseProps } from './types'

export interface SavedVacuumCycleProps extends VacuumCycleBaseProps {
  cycleId: string
  onEdit: (cycleId: string) => void
  onDeleteStep: (stepId: string) => void
}

export function SavedVacuumCycle(props: SavedVacuumCycleProps): JSX.Element {
  const {
    orderedProfileStepIds,
    profileStepItemsById,
    displayIndex,
    cycleId,
    onEdit,
    onDelete,
    onDeleteStep,
    repetitions,
  } = props
  const { t } = useTranslation('protocol_steps')

  return (
    <ListItem type="default" padding={0}>
      <div className={styles.saved_vacuum_cycle_content}>
        <div className={styles.saved_vacuum_cycle_header}>
          <div className={styles.saved_vacuum_cycle_header_row}>
            <div className={styles.flex_row_gap_24}>
              <Tag text={displayIndex} type="default" shrinkToContent />
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('vacuum.controls.profile.cycle_repetitions', {
                  repetitions,
                })}
              </StyledText>
            </div>
            <div className={styles.flex_row_gap_8}>
              <BasicButton
                onClick={() => {
                  onEdit(cycleId)
                }}
                underLine
              >
                {t('vacuum.controls.profile.edit')}
              </BasicButton>
              <div className={styles.delete_button} onClick={onDelete}>
                <Icon name="close" size="1.5rem" />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.saved_vacuum_cycle_steps_container}>
          <div className={styles.cycle_steps_list}>
            {orderedProfileStepIds.map((stepId: string, stepIndex: number) => {
              const stepData = profileStepItemsById[stepId]
              if (stepData == null) {
                return null
              }
              const { id } = stepData
              return (
                <SavedVacuumStep
                  key={id}
                  displayIndex={`${displayIndex}.${stepIndex + 1}`}
                  stepData={stepData}
                  onDelete={() => {
                    onDeleteStep(id)
                  }}
                  onEdit={() => {
                    onEdit(cycleId)
                  }}
                  isNested
                  allowDelete={orderedProfileStepIds.length > 1}
                />
              )
            })}
          </div>
        </div>
      </div>
    </ListItem>
  )
}
