import { useTranslation } from 'react-i18next'

import {
  BasicButton,
  COLORS,
  Icon,
  ListItem,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'
import { VACUUM_MODE_PRESSURE } from '@opentrons/step-generation'

import styles from './vacuumprofile.module.css'

import type { ReactNode } from 'react'
import type { VacuumStepBaseProps } from './types'

export interface SavedVacuumStepProps extends VacuumStepBaseProps {
  onEdit: (id: string) => void
}

export function SavedVacuumStep(props: SavedVacuumStepProps): ReactNode {
  const {
    stepData,
    displayIndex,
    isNested,
    onDelete,
    onEdit,
    allowDelete = true,
  } = props
  const { title, time, pumpData } = stepData
  const { mode } = pumpData
  const { t } = useTranslation('protocol_steps')
  const formattedPumpDetail =
    mode === VACUUM_MODE_PRESSURE
      ? t('vacuum.controls.profile.step_detail.pressure', {
          pressure: pumpData.pressureMbar,
        })
      : t('vacuum.controls.profile.step_detail.power', {
          power: pumpData.percentPower,
        })
  return (
    <ListItem
      type="default"
      padding={SPACING.spacing12}
      backgroundColor={isNested ? COLORS.grey10 : COLORS.grey20}
      className={styles.saved_vacuum_step_row}
    >
      <div className={styles.flex_row_gap_24}>
        <Tag text={displayIndex} type="default" shrinkToContent />
        <StyledText desktopStyle="bodyDefaultRegular">
          {[title, formattedPumpDetail, time].join(', ')}
        </StyledText>
      </div>
      <div className={styles.flex_row_gap_8}>
        {!isNested && (
          <BasicButton
            onClick={() => {
              onEdit(stepData.id)
            }}
            underLine
          >
            {t('vacuum.controls.profile.edit')}
          </BasicButton>
        )}
        {allowDelete && (
          <div className={styles.delete_button} onClick={onDelete}>
            <Icon name="close" size="1.5rem" />
          </div>
        )}
      </div>
    </ListItem>
  )
}
