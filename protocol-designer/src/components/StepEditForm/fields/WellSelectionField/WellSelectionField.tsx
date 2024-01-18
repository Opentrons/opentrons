import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { FormGroup, InputField } from '@opentrons/components'
import { ALL, COLUMN } from '@opentrons/shared-data'
import {
  actions as stepsActions,
  getSelectedStepId,
  getWellSelectionLabwareKey,
} from '../../../../ui/steps'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { Portal } from '../../../portals/MainPageModalPortal'
import { WellSelectionModal } from './WellSelectionModal'
import styles from '../../StepEditForm.css'

import type { NozzleType } from '../../../../types'
import type { FieldProps } from '../../types'

export type Props = FieldProps & {
  nozzles: string | null
  pipetteId?: string | null
  labwareId?: string | null
}

export const WellSelectionField = (props: Props): JSX.Element => {
  const { t } = useTranslation('form')
  const {
    nozzles,
    labwareId,
    pipetteId,
    onFieldFocus,
    value: selectedWells,
    updateValue,
    onFieldBlur,
    name,
    disabled,
    errorToShow,
  } = props
  const dispatch = useDispatch()
  const stepId = useSelector(getSelectedStepId)
  const pipetteEntities = useSelector(stepFormSelectors.getPipetteEntities)
  const wellSelectionLabwareKey = useSelector(getWellSelectionLabwareKey)
  const primaryWellCount = Array.isArray(selectedWells)
    ? selectedWells.length.toString()
    : undefined
  const pipette = pipetteId != null ? pipetteEntities[pipetteId] : null
  const is8Channel = pipette != null ? pipette.spec.channels === 8 : false

  let nozzleType: NozzleType | null = null
  if (pipette !== null && is8Channel) {
    nozzleType = '8-channel'
  } else if (nozzles === COLUMN) {
    nozzleType = COLUMN
  } else if (nozzles === ALL) {
    nozzleType = ALL
  }

  const getModalKey = (): string => {
    return `${String(stepId)}${name}${pipetteId || 'noPipette'}${
      labwareId || 'noLabware'
    }`
  }

  const onOpen = (key: string): void => {
    dispatch(stepsActions.setWellSelectionLabwareKey(key))
  }
  const handleOpen = (): void => {
    if (onFieldFocus) {
      onFieldFocus()
    }
    if (labwareId && pipetteId) {
      onOpen(getModalKey())
    }
  }

  const handleClose = (): void => {
    if (onFieldBlur) {
      onFieldBlur()
    }
    dispatch(stepsActions.clearWellSelectionLabwareKey())
  }

  const modalKey = getModalKey()
  const label =
    nozzleType === '8-channel' || nozzleType === COLUMN
      ? t('step_edit_form.wellSelectionLabel.columns')
      : t('step_edit_form.wellSelectionLabel.wells')
  return (
    <FormGroup label={label} disabled={disabled} className={styles.small_field}>
      <InputField
        readOnly
        name={name}
        value={primaryWellCount ?? null}
        onClick={handleOpen}
        error={errorToShow}
      />
      <Portal>
        <WellSelectionModal
          isOpen={wellSelectionLabwareKey === modalKey}
          key={modalKey}
          labwareId={labwareId}
          name={name}
          onCloseClick={handleClose}
          pipetteId={pipetteId}
          updateValue={updateValue}
          value={selectedWells}
          nozzleType={nozzleType}
        />
      </Portal>
    </FormGroup>
  )
}
