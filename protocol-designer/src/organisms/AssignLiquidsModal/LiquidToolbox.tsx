import {
  Btn,
  DIRECTION_COLUMN,
  DropdownMenu,
  Flex,
  InputField,
  JUSTIFY_SPACE_BETWEEN,
  LargeButton,
  ListItem,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  Toolbox,
} from '@opentrons/components'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import * as fieldProcessors from '../../steplist/fieldLevel/processing'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { getLabwareEntities } from '../../step-forms/selectors'
import { useTranslation } from 'react-i18next'
import { getSelectedWells } from '../../well-selection/selectors'
import {
  removeWellsContents,
  setWellContents,
} from '../../labware-ingred/actions'
import { Controller, useForm } from 'react-hook-form'
import { deselectAllWells } from '../../well-selection/actions'

interface ValidFormValues {
  selectedLiquidId: string
  volume: string
}

interface ToolboxFormValues {
  selectedLiquidId?: string | null
  volume?: string | null
}
interface LiquidToolboxProps {
  onClose: () => void
}
export function LiquidToolbox(props: LiquidToolboxProps): JSX.Element {
  const { onClose } = props
  const { t } = useTranslation(['liquids', 'shared'])
  const labwareEntities = useSelector(getLabwareEntities)
  const dispatch = useDispatch()
  const labwareId = useSelector(labwareIngredSelectors.getSelectedLabwareId)
  const selectedWellGroups = useSelector(getSelectedWells)
  const selectedWells = Object.keys(selectedWellGroups)
  const labwareDisplayName =
    labwareId != null ? labwareEntities[labwareId].def.metadata.displayName : ''
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
    labwareId != null &&
      liquidLocations[labwareId] != null &&
      Object.keys(selectedWellGroups).some(
        well => liquidLocations[labwareId][well]
      )
  )

  const getInitialValues: () => ValidFormValues = () => {
    return {
      selectedLiquidId: commonSelectedLiquidId ?? '',
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
  } = useForm<ToolboxFormValues>({
    defaultValues: getInitialValues(),
  })

  const selectedLiquidId = watch('selectedLiquidId')
  const volume = watch('volume')

  const handleCancelForm = (): void => {
    dispatch(deselectAllWells())
  }

  const handleClearWells: () => void = () => {
    if (labwareId != null && selectedWells != null && selectionHasLiquids) {
      if (global.confirm(t('application:are_you_sure') as string)) {
        dispatch(
          removeWellsContents({
            labwareId,
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

  const handleSaveForm = (values: ToolboxFormValues): void => {
    const volume = Number(values.volume)
    const { selectedLiquidId } = values
    console.assert(
      labwareId != null,
      'when saving liquid placement form, expected a selected labware ID'
    )
    console.assert(
      selectedWells != null && selectedWells.length > 0,
      `when saving liquid placement form, expected selected wells to be array with length > 0 but got ${String(
        selectedWells
      )}`
    )
    console.assert(
      selectedLiquidId != null,
      `when saving liquid placement form, expected selectedLiquidId to be non-nullsy but got ${String(
        selectedLiquidId
      )}`
    )
    console.assert(
      volume > 0,
      `when saving liquid placement form, expected volume > 0, got ${volume}`
    )

    if (labwareId != null && selectedLiquidId != null) {
      dispatch(
        setWellContents({
          liquidGroupId: selectedLiquidId,
          labwareId,
          wells: selectedWells ?? [],
          volume: Number(values.volume),
        })
      )
    }
  }

  const handleSaveSubmit: (values: ToolboxFormValues) => void = values => {
    handleSaveForm(values)
  }

  let volumeErrors: string | null = null
  if (Boolean(touchedFields.volume)) {
    if (volume == null || volume === '0') {
      volumeErrors = t('generic.error.more_than_zero')
    } else if (parseInt(volume) > selectedWellsMaxVolume) {
      volumeErrors = t('liquid_placement.volume_exceeded', {
        volume: selectedWellsMaxVolume,
      })
    }
  }

  return (
    <Toolbox
      title={labwareDisplayName}
      confirmButtonText={t('shared:done')}
      onConfirmClick={onClose}
      onCloseClick={handleClearWells}
      closeButtonText="Clear wells"
    >
      <form onSubmit={handleSubmit(handleSaveSubmit)}>
        <ListItem type="noActive">
          <Flex
            padding={SPACING.spacing12}
            gridGap={SPACING.spacing12}
            flexDirection={DIRECTION_COLUMN}
          >
            <StyledText desktopStyle="bodyDefaultSemiBold">
              Add liquid
            </StyledText>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              <StyledText desktopStyle="bodyDefaultRegular">Liquid</StyledText>
              <Controller
                name="selectedLiquidId"
                control={control}
                rules={{
                  required: true,
                }}
                render={({ field }) => {
                  const selectLiquidIdName = liquidSelectionOptions.find(
                    option => option.value === selectedLiquidId
                  )?.name

                  return (
                    <DropdownMenu
                      filterOptions={liquidSelectionOptions}
                      //   error={
                      //     Boolean(touchedFields.selectedLiquidId)
                      //       ? errors.selectedLiquidId?.message
                      //       : null
                      //   }
                      currentOption={{
                        value: selectedLiquidId ?? '',
                        name: selectLiquidIdName ?? '',
                      }}
                      onClick={field.onChange}
                    />
                  )
                }}
              />
            </Flex>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              <StyledText desktopStyle="bodyDefaultRegular">
                Liquid volume by well
              </StyledText>
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
            </Flex>
            <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
              <Btn
                textDecoration={TYPOGRAPHY.textDecorationUnderline}
                onClick={handleCancelForm}
              >
                <StyledText desktopStyle="bodyDefaultRegular">
                  Cancel
                </StyledText>
              </Btn>
              <LargeButton type="submit" buttonText={'Add'} />
            </Flex>
          </Flex>
        </ListItem>
      </form>
    </Toolbox>
  )
}
