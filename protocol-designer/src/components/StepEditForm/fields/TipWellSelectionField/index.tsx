import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createPortal } from 'react-dom'
import { FormGroup, LegacyInputField } from '@opentrons/components'
import { getPipetteEntities } from '../../../../step-forms/selectors'
import { getNozzleType } from '../../utils'
import { getMainPagePortalEl } from '../../../portals/MainPageModalPortal'
import { WellSelectionModal } from '../WellSelectionField/WellSelectionModal'
import type { StepFormDropdown } from '../StepFormDropdownField'

import styles from '../../StepEditForm.module.css'

type TipWellSelectionFieldProps = Omit<
  React.ComponentProps<typeof StepFormDropdown>,
  'options'
> & {
  pipetteId: unknown
  labwareId: unknown
  nozzles: string | null
}

export function TipWellSelectionField(
  props: TipWellSelectionFieldProps
): JSX.Element {
  const {
    value: selectedWells,
    errorToShow,
    name,
    updateValue,
    disabled,
    pipetteId,
    labwareId,
    nozzles,
  } = props
  const { t } = useTranslation('form')
  const pipetteEntities = useSelector(getPipetteEntities)
  const primaryWellCount =
    Array.isArray(selectedWells) && selectedWells.length > 0
      ? selectedWells.length.toString()
      : null
  const [openModal, setOpenModal] = useState<boolean>(false)
  const pipette = pipetteId != null ? pipetteEntities[String(pipetteId)] : null
  const nozzleType = getNozzleType(pipette, nozzles)

  return (
    <>
      {createPortal(
        <WellSelectionModal
          isOpen={openModal}
          key={`${labwareId}_${name}_TipField`}
          labwareId={String(labwareId)}
          name={name}
          onCloseClick={() => {
            setOpenModal(false)
          }}
          pipetteId={String(pipetteId)}
          updateValue={updateValue}
          value={selectedWells}
          nozzleType={nozzleType}
        />,

        getMainPagePortalEl()
      )}

      <FormGroup
        disabled={disabled}
        label={t('step_edit_form.wellSelectionLabel.wells')}
        className={styles.small_field}
      >
        <LegacyInputField
          readOnly
          error={errorToShow}
          name={name}
          value={primaryWellCount}
          onClick={() => {
            setOpenModal(true)
          }}
        />
      </FormGroup>
    </>
  )
}
