import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'

import { isUiOnlyFieldId } from './complianceReadySettingsTypes'
import styles from './compliancereadysoftwaresettings.module.css'

import type { JSX, ReactNode } from 'react'
import type {
  ComplianceReadyToggleChangeOptions,
  FieldValues,
  SettingFieldId,
} from './complianceReadySettingsTypes'

export interface ComplianceReadyToggleFieldProps {
  id: SettingFieldId
  labelKey: string
  values: FieldValues
  childFieldIds?: SettingFieldId[]
  parentFieldId?: SettingFieldId
  onToggleChange: (
    fieldId: SettingFieldId,
    options?: ComplianceReadyToggleChangeOptions
  ) => void
  children?: ReactNode
}

export function ComplianceReadyToggleField({
  id,
  labelKey,
  values,
  childFieldIds,
  parentFieldId,
  onToggleChange,
  children,
}: ComplianceReadyToggleFieldProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const serverToggledOn = Boolean(values[id])
  const [expanded, setExpanded] = useState(false)
  const toggledOn =
    serverToggledOn || (children != null && isUiOnlyFieldId(id) && expanded)
  const label = t(labelKey)

  const handleToggleClick = (): void => {
    const nextToggledOn = !toggledOn

    if (children != null && isUiOnlyFieldId(id)) {
      setExpanded(nextToggledOn)
    }

    onToggleChange(id, {
      parentFieldId,
      childFieldIds,
      toggledOn: nextToggledOn,
    })
  }

  const toggleRow = (
    <div className={styles.toggle_row}>
      <StyledText
        desktopStyle="bodyDefaultRegular"
        className={styles.toggle_label}
      >
        {label}
      </StyledText>
      <ToggleButton
        id={id}
        label={label}
        toggledOn={toggledOn}
        onClick={handleToggleClick}
      />
    </div>
  )

  if (children == null) {
    return toggleRow
  }

  return (
    <div className={styles.toggle_setting}>
      {toggleRow}
      {toggledOn ? <div className={styles.sub_fields}>{children}</div> : null}
    </div>
  )
}
