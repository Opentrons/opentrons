import * as React from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { COLUMN } from '@opentrons/shared-data'
import {
  actions as stepsActions,
  getSelectedStepId,
  getWellSelectionLabwareKey,
} from '../../../../../ui/steps'
import { selectors as stepFormSelectors } from '../../../../../step-forms'
import { getMainPagePortalEl } from '../../../../../components/portals/MainPageModalPortal'
import { WellSelectionModal } from '../../../../../components/StepEditForm/fields/WellSelectionField/WellSelectionModal'
import { getNozzleType } from '../utils'
import type { FieldProps } from '../types'

export type WellSelectionFieldProps = FieldProps & {
  nozzles: string | null
  pipetteId?: string | null
  labwareId?: string | null
}

export const WellSelectionField = (
  props: WellSelectionFieldProps
): JSX.Element => {
  const { t, i18n } = useTranslation('form')
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
  const primaryWellCount =
    Array.isArray(selectedWells) && selectedWells.length > 0
      ? selectedWells.length.toString()
      : undefined
  const pipette = pipetteId != null ? pipetteEntities[pipetteId] : null
  const nozzleType = getNozzleType(pipette, nozzles)

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
      ? t(`step_edit_form.wellSelectionLabel.columns_${name}`)
      : t(`step_edit_form.wellSelectionLabel.wells_${name}`)

  return (
    <>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing16}>
        <Flex gridGap={SPACING.spacing8} paddingBottom={SPACING.spacing8}>
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {i18n.format(label, 'capitalize')}
          </StyledText>
        </Flex>
        <InputField
          disabled={disabled}
          readOnly
          name={name}
          error={errorToShow}
          value={primaryWellCount ?? null}
          onClick={handleOpen}
        />
      </Flex>
      {createPortal(
        //  TODO(ja): update this modal to match designs
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
        />,
        getMainPagePortalEl()
      )}
    </>
  )
}
