import { useTranslation } from 'react-i18next'

import { ListItem, StyledText, Tag } from '@opentrons/components'
import { VACUUM_MODE_POWER, VACUUM_VENT_OPEN } from '@opentrons/step-generation'

import styles from './vacuumtools.module.css'

import type { ReactNode } from 'react'
import type { VacuumModuleState as VacuumModuleStateType } from '@opentrons/step-generation'

interface VacuumModuleStateProps {
  vacuumModuleState: VacuumModuleStateType | null
}
export function VacuumModuleState(props: VacuumModuleStateProps): ReactNode {
  const { vacuumModuleState } = props
  const { t } = useTranslation('protocol_steps')
  const { currentPumpActivity, ventStatus } = vacuumModuleState ?? {}
  const ventText =
    ventStatus != null
      ? t(`vacuum.previous_state.vent.${ventStatus}`)
      : t(`vacuum.previous_state.vent.${VACUUM_VENT_OPEN}`) // default to open if value is null (initial)
  let pumpText: string
  if (
    currentPumpActivity == null ||
    currentPumpActivity?.type === 'pumpDeactivated'
  ) {
    pumpText = t('vacuum.previous_state.pump.off')
  } else if (currentPumpActivity.type === 'profile') {
    // This is an error case handled by step generation (you cannot run a vacuum step when a profile is running)
    pumpText = t('vacuum.previous_state.pump.profile')
  } else {
    pumpText =
      currentPumpActivity.mode === VACUUM_MODE_POWER
        ? t('vacuum.previous_state.pump.power', {
            power: currentPumpActivity.targetPower,
          })
        : t('vacuum.previous_state.pump.pressure', {
            pressure: currentPumpActivity.targetPressure,
          })
  }
  return (
    <div className={styles.vacuum_state_container}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('vacuum.previous_state.last_module_state')}
      </StyledText>
      <div className={styles.state_list}>
        <ListItem type="default" className={styles.state_list_item}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('vacuum.previous_state.pump.label')}
          </StyledText>
          <Tag type="default" text={pumpText} shrinkToContent />
        </ListItem>
        <ListItem type="default" className={styles.state_list_item}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('vacuum.previous_state.vent.label')}
          </StyledText>
          <Tag type="default" text={ventText} shrinkToContent />
        </ListItem>
      </div>
    </div>
  )
}
