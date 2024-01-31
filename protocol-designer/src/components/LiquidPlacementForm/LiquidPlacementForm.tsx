import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import isEmpty from 'lodash/isEmpty'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import assert from 'assert'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import * as fieldProcessors from '../../steplist/fieldLevel/processing'
import {
  DropdownField,
  FormGroup,
  OutlineButton,
  DeprecatedPrimaryButton,
  InputField,
} from '@opentrons/components'
import { deselectAllWells } from '../../well-selection/actions'
import {
  removeWellsContents,
  setWellContents,
} from '../../labware-ingred/actions'
import { getSelectedWells } from '../../well-selection/selectors'

import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'

import styles from './LiquidPlacementForm.css'
import formStyles from '../forms/forms.css'
import stepEditFormStyles from '../StepEditForm/StepEditForm.css'

interface ValidFormValues {
  selectedLiquidId: string
  volume: string
}
interface LiquidPlacementFormValues {
  selectedLiquidId?: string | null
  volume?: string | null
}

export const LiquidPlacementForm = (): JSX.Element | null => {
  const { t } = useTranslation(['form', 'button', 'application'])
  const selectedWellGroups = useSelector(getSelectedWells)
  const selectedWells = Object.keys(selectedWellGroups)
  const showForm = !isEmpty(selectedWellGroups)
  const dispatch = useDispatch()
  const labwareId = useSelector(labwareIngredSelectors.getSelectedLabwareId)
  const liquidLocations = useSelector(
    labwareIngredSelectors.getLiquidsByLabwareId
  )
  const commonSelectedLiquidId = useSelector(
    wellContentsSelectors.getSelectedWellsCommonIngredId
  )
  const commonSelectedVolume = useSelector(
    wellContentsSelectors.getSelectedWellsCommonVolume
  )
  const selectedWellsMaxVolume = useSelector(
    wellContentsSelectors.getSelectedWellsMaxVolume
  )
  const liquidSelectionOptions = useSelector(
    labwareIngredSelectors.getLiquidSelectionOptions
  )

  const selectionHasLiquids = Boolean(
    labwareId &&
      liquidLocations[labwareId] &&
      Object.keys(selectedWellGroups).some(
        well => liquidLocations[labwareId][well]
      )
  )

  const getInitialValues: () => ValidFormValues = () => {
    return {
      selectedLiquidId: commonSelectedLiquidId || '',
      volume:
        commonSelectedVolume != null ? commonSelectedVolume.toString() : '',
    }
  }

  const {
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, touchedFields },
  } = useForm<LiquidPlacementFormValues>({
    defaultValues: getInitialValues(),
  })

  const [selectedLiquidId, volume] = watch(['selectedLiquidId', 'volume'])

  const handleCancelForm = (): void => {
    dispatch(deselectAllWells())
  }

  const handleClearWells: () => void = () => {
    if (labwareId && selectedWells && selectionHasLiquids) {
      if (global.confirm(t('application:are_you_sure'))) {
        dispatch(
          removeWellsContents({
            labwareId: labwareId,
            wells: selectedWells,
          })
        )
      }
    }
  }

  const handleChangeVolume: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void = e => {
    const value: string | null | undefined = e.currentTarget.value
    const masked = fieldProcessors.composeMaskers(
      fieldProcessors.maskToFloat,
      fieldProcessors.onlyPositiveNumbers,
      fieldProcessors.trimDecimals(1)
    )(value) as string
    setValue('volume', masked)
  }

  const handleSaveForm = (values: LiquidPlacementFormValues): void => {
    const volume = Number(values.volume)
    const { selectedLiquidId } = values
    assert(
      labwareId != null,
      'when saving liquid placement form, expected a selected labware ID'
    )
    assert(
      selectedWells && selectedWells.length > 0,
      `when saving liquid placement form, expected selected wells to be array with length > 0 but got ${String(
        selectedWells
      )}`
    )
    assert(
      selectedLiquidId != null,
      `when saving liquid placement form, expected selectedLiquidId to be non-nullsy but got ${String(
        selectedLiquidId
      )}`
    )
    assert(
      volume > 0,
      `when saving liquid placement form, expected volume > 0, got ${volume}`
    )

    if (labwareId != null && selectedLiquidId != null) {
      dispatch(
        setWellContents({
          liquidGroupId: selectedLiquidId,
          labwareId: labwareId,
          wells: selectedWells || [],
          volume: Number(values.volume),
        })
      )
    }
  }

  const handleSaveSubmit: (
    values: LiquidPlacementFormValues
  ) => void = values => {
    handleSaveForm(values)
  }

  if (!showForm) return null

  let volumeErrors: string | null = null
  if (touchedFields.volume) {
    if (volume == null || volume === '0') {
      volumeErrors = t('generic.error.more_than_zero')
    } else if (parseInt(volume) > selectedWellsMaxVolume) {
      volumeErrors = t('liquid_placement.volume_exceeded', {
        volume: selectedWellsMaxVolume,
      })
    }
  }

  return (
    <div className={formStyles.form}>
      <form onSubmit={handleSubmit(handleSaveSubmit)}>
        <div className={styles.field_row}>
          <FormGroup
            label={t('liquid_placement.liquid')}
            className={styles.liquid_field}
          >
            <Controller
              name="selectedLiquidId"
              control={control}
              rules={{
                required: true,
              }}
              render={({ field }) => (
                <DropdownField
                  name="selectedLiquidId"
                  className={stepEditFormStyles.large_field}
                  options={liquidSelectionOptions}
                  error={
                    touchedFields.selectedLiquidId
                      ? errors.selectedLiquidId?.message
                      : null
                  }
                  value={selectedLiquidId}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </FormGroup>
          <FormGroup
            label={t('liquid_placement.volume')}
            className={styles.volume_field}
          >
            <Controller
              name="volume"
              control={control}
              rules={{
                required: true,
              }}
              render={({ field }) => (
                <InputField
                  name="volume"
                  units={t('application:units.microliter')}
                  value={volume}
                  error={volumeErrors}
                  onBlur={field.onBlur}
                  onChange={handleChangeVolume}
                />
              )}
            />
          </FormGroup>
        </div>

        <div className={styles.button_row}>
          <OutlineButton
            disabled={!(labwareId && selectedWells && selectionHasLiquids)}
            onClick={handleClearWells}
          >
            {t('button:clear_wells')}
          </OutlineButton>
          <OutlineButton onClick={handleCancelForm}>
            {t('button:cancel')}
          </OutlineButton>
          <DeprecatedPrimaryButton
            type="submit"
            disabled={volumeErrors != null || volume == null || volume === ''}
          >
            {t('button:save')}
          </DeprecatedPrimaryButton>
        </div>
      </form>
    </div>
  )
}
