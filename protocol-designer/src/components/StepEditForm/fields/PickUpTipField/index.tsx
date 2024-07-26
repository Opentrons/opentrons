import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { DropdownField, DropdownOption, FormGroup } from '@opentrons/components'
import { getLabwareEntities } from '../../../../step-forms/selectors'
import styles from '../../StepEditForm.module.css'
import { StepFormDropdown } from '../StepFormDropdownField'
import { createPortal } from 'react-dom'
import { getMainPagePortalEl } from '../../../portals/MainPageModalPortal'
import { getAllTiprackOptions } from '../../../../ui/labware/selectors'
import { WellSelectionModal } from '../WellSelectionField/WellSelectionModal'

export function PickUpTipField(
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
  const labwareEntities = useSelector(getLabwareEntities)
  const tiprackOptions = useSelector(getAllTiprackOptions)
  const defaultOption: DropdownOption = {
    name: 'Default - get next tip',
    value: '',
  }

  React.useEffect(() => {
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
          key={`${labwareId}_PickUpTipField`}
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
        label={t('step_edit_form.field.location.pickUp')}
        className={styles.large_field}
      >
        <DropdownField
          disabled={disabled}
          options={[defaultOption, ...tiprackOptions]}
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
