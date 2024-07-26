import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { DropdownField, FormGroup } from '@opentrons/components'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
} from '../../../../step-forms/selectors'
import styles from '../../StepEditForm.module.css'
import type { DropdownOption } from '@opentrons/components'
import { StepFormDropdown } from '../StepFormDropdownField'
import { createPortal } from 'react-dom'
import { getMainPagePortalEl } from '../../../portals/MainPageModalPortal'
import { getAllTiprackOptions } from '../../../../ui/labware/selectors'
import { WellSelectionModal } from '../WellSelectionField/WellSelectionModal'
import { getEnableReturnTip } from '../../../../feature-flags/selectors'

export function DropTipField(
  props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'> & {
    selectedWells?: unknown
    updateWellsValue: (arg0: unknown) => void
  }
): JSX.Element {
  const {
    value: dropdownItem,
    name,
    onFieldBlur,
    onFieldFocus,
    updateValue,
    selectedWells,
    updateWellsValue,
    disabled,
  } = props
  const { t } = useTranslation('form')
  const [openModal, setOpenModal] = React.useState<boolean>(false)
  const additionalEquipment = useSelector(getAdditionalEquipmentEntities)
  const labwareEntities = useSelector(getLabwareEntities)
  const tiprackOptions = useSelector(getAllTiprackOptions)
  const enableReturnTip = useSelector(getEnableReturnTip)
  console.log('selectedWells', selectedWells)

  const wasteChute = Object.values(additionalEquipment).find(
    aE => aE.name === 'wasteChute'
  )
  const trashBin = Object.values(additionalEquipment).find(
    aE => aE.name === 'trashBin'
  )
  const wasteChuteOption: DropdownOption = {
    name: 'Waste Chute',
    value: wasteChute?.id ?? '',
  }
  const trashOption: DropdownOption = {
    name: 'Trash Bin',
    value: trashBin?.id ?? '',
  }

  const options: DropdownOption[] = []
  if (wasteChute != null) options.push(wasteChuteOption)
  if (trashBin != null) options.push(trashOption)

  React.useEffect(() => {
    if (
      additionalEquipment[String(dropdownItem)] == null &&
      labwareEntities[String(dropdownItem)] == null
    ) {
      updateValue(null)
    }
    if (labwareEntities[String(dropdownItem)] != null) {
      setOpenModal(true)
    }
  }, [dropdownItem])

  const labwareId = labwareEntities[String(dropdownItem)]?.id ?? null

  return (
    <>
      {createPortal(
        <WellSelectionModal
          isOpen={openModal}
          key={`${labwareId}_DropTipField`}
          labwareId={labwareId}
          name={name}
          onCloseClick={() => setOpenModal(false)}
          pipetteId={undefined}
          updateValue={updateWellsValue}
          value={selectedWells}
          nozzleType={null}
        />,

        getMainPagePortalEl()
      )}

      <FormGroup
        label={
          enableReturnTip
            ? t('step_edit_form.field.location.dropTip')
            : t('step_edit_form.field.location.label')
        }
        className={styles.large_field}
      >
        <DropdownField
          disabled={disabled}
          options={[...options, ...tiprackOptions]}
          name={name}
          value={dropdownItem ? String(dropdownItem) : null}
          onBlur={onFieldBlur}
          onFocus={onFieldFocus}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            updateValue(e.currentTarget.value)
          }}
        />
      </FormGroup>
    </>
  )
}
