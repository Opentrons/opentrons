import { useTranslation } from 'react-i18next'

import {
  BasicButton,
  StyledText,
  Tag,
  TertiaryButton,
} from '@opentrons/components'

import { PROFILE_STEP } from './constants'
import styles from './vacuumprofile.module.css'

import type { ReactNode } from 'react'
import type { PROFILE_CYCLE } from './constants'

export interface PresavedVacuumHeaderProps {
  displayIndex: string
  variant: typeof PROFILE_STEP | typeof PROFILE_CYCLE
  onDelete: () => void
  onSave: () => void
  showActions?: boolean
}

export function PresavedVacuumHeader(
  props: PresavedVacuumHeaderProps
): ReactNode {
  const { displayIndex, variant, onDelete, onSave, showActions = true } = props
  const { t } = useTranslation('protocol_steps')

  return (
    <div className={styles.presaved_vacuum_header}>
      <div className={styles.flex_row_gap_24}>
        <Tag text={displayIndex} type="default" shrinkToContent />
        <StyledText desktopStyle="bodyDefaultRegular">
          {t(
            `vacuum.controls.profile.${variant === PROFILE_STEP ? 'step' : 'cycle'}`
          )}
        </StyledText>
      </div>
      {showActions && (
        <div className={styles.flex_row_gap_8}>
          <BasicButton onClick={onDelete} underLine>
            {t('vacuum.controls.profile.delete')}
          </BasicButton>
          <TertiaryButton buttonType="primary" onClick={onSave}>
            {t('vacuum.controls.profile.save')}
          </TertiaryButton>
        </div>
      )}
    </div>
  )
}
