import { useTranslation } from 'react-i18next'

import {
  Chip,
  COLORS,
  FLEX_MAX_CONTENT,
  StyledText,
} from '@opentrons/components'

import { getPumpStatusProps } from '../utils'
import { formatDisplayPressureMbar } from './utils/formatDisplayPressureMbar'
import styles from './vacuummodule.module.css'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { VacuumModuleData as VacuumModuleDataType } from '@opentrons/api-client'

interface VacuumModuleDataProps {
  moduleData: VacuumModuleDataType
}

export function VacuumModuleData(props: VacuumModuleDataProps): ReactNode {
  const { t } = useTranslation('device_details')
  const { moduleData } = props
  const {
    currentPressure: rawCurrentPressure,
    targetPressure: rawTargetPressure,
    currentPower,
    targetPower,
    modeType,
    ventStatus,
    status,
  } = moduleData
  const currentPressure = formatDisplayPressureMbar(rawCurrentPressure)
  const targetPressure = formatDisplayPressureMbar(rawTargetPressure)
  return (
    <div className={styles.vacuum_module_container}>
      {/* Vacuum Pump section */}
      <div className={styles.vacuum_pump_container}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('vacuum_pump')}
        </StyledText>
        <Chip
          {...getPumpStatusProps(t as TFunction, status)}
          iconName="connection-status"
          chipSize="small"
          width={FLEX_MAX_CONTENT}
        />
        <div className={styles.vacuum_pressure_power_container}>
          {modeType === 'pressure' ? (
            <>
              <StyledText desktopStyle="bodyDefaultRegular">
                {currentPressure == null
                  ? t('na_current')
                  : t('current_pressure', { pressure: currentPressure })}
              </StyledText>
              <StyledText desktopStyle="bodyDefaultRegular">
                {targetPressure == null
                  ? t('na_target')
                  : t('target_pressure', { pressure: targetPressure })}
              </StyledText>
            </>
          ) : (
            <>
              <StyledText desktopStyle="bodyDefaultRegular">
                {currentPower == null
                  ? t('na_current')
                  : t('current_power', { power: currentPower })}
              </StyledText>
              <StyledText desktopStyle="bodyDefaultRegular">
                {targetPower == null
                  ? t('na_target')
                  : t('target_power', { power: targetPower })}
              </StyledText>
            </>
          )}
        </div>
      </div>
      {/* Vent section */}
      <div className={styles.vacuum_vent_container}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('vent')}
        </StyledText>
        <Chip
          type="neutral"
          text={t(ventStatus === 'opened' ? 'vent_open' : 'vent_closed')}
          iconName="connection-status"
          chipSize="small"
          width={FLEX_MAX_CONTENT}
        />
      </div>
    </div>
  )
}
