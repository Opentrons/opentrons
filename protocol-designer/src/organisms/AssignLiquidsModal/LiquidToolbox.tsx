import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Btn,
  DIRECTION_COLUMN,
  DropdownMenu,
  Flex,
  InputField,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  Toolbox,
} from '@opentrons/components'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import * as fieldProcessors from '../../steplist/fieldLevel/processing'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { getSelectedWells } from '../../well-selection/selectors'
import { getLabwareNicknamesById } from '../../ui/labware/selectors'
import {
  removeWellsContents,
  setWellContents,
} from '../../labware-ingred/actions'
import { deselectAllWells } from '../../well-selection/actions'
import { LiquidCard } from './LiquidCard'

import type { DropdownOption } from '@opentrons/components'
import type { ContentsByWell } from '../../labware-ingred/types'

export interface LiquidInfo {
  name: string
  color: string
  liquidIndex: string
}

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
  const dispatch = useDispatch()
  const liquids = useSelector(labwareIngredSelectors.allIngredientNamesIds)
  const labwareId = useSelector(labwareIngredSelectors.getSelectedLabwareId)
  const selectedWellGroups = useSelector(getSelectedWells)
  const nickNames = useSelector(getLabwareNicknamesById)
  const selectedWells = Object.keys(selectedWellGroups)
  const labwareDisplayName = labwareId != null ? nickNames[labwareId] : ''
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
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
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
    reset,
    formState: { touchedFields },
  } = useForm<ToolboxFormValues>({
    defaultValues: getInitialValues(),
  })

  const selectedLiquidId = watch('selectedLiquidId')
  const volume = watch('volume')

  const handleCancelForm = (): void => {
    dispatch(deselectAllWells())
  }

  const handleClearSelectedWells: () => void = () => {
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
    reset()
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

  let wellContents: ContentsByWell | null = null
  if (allWellContentsForActiveItem != null && labwareId != null) {
    wellContents = allWellContentsForActiveItem[labwareId]
  }

  const liquidsInLabware =
    wellContents != null
      ? Object.values(wellContents).flatMap(content => content.groupIds)
      : null

  const uniqueLiquids = Array.from(new Set(liquidsInLabware))

  const liquidInfo = uniqueLiquids
    .map(liquid => {
      const foundLiquid = Object.values(liquids).find(
        id => id.ingredientId === liquid
      )
      // TODO (nd: 09/05/2024): add description
      return {
        liquidIndex: liquid,
        name: foundLiquid?.name ?? '',
        color: foundLiquid?.displayColor ?? '',
      } as LiquidInfo
    })
    .filter(Boolean)
  return (
    <Toolbox
      title={
        <StyledText desktopStyle="bodyLargeSemiBold">
          {labwareDisplayName}
        </StyledText>
      }
      confirmButtonText={t('shared:done')}
      onConfirmClick={onClose}
      onCloseClick={handleClearSelectedWells}
      height="calc(100vh - 64px)"
      closeButtonText={t('clear_wells')}
      disableCloseButton={
        !(labwareId != null && selectedWells != null && selectionHasLiquids)
      }
    >
      <form onSubmit={handleSubmit(handleSaveSubmit)}>
        <ListItem type="noActive">
          {selectedWells.length > 0 ? (
            <Flex
              padding={SPACING.spacing12}
              gridGap={SPACING.spacing12}
              flexDirection={DIRECTION_COLUMN}
            >
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('add_liquid')}
              </StyledText>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {t('liquid')}
                </StyledText>
                <Controller
                  name="selectedLiquidId"
                  control={control}
                  rules={{
                    required: true,
                  }}
                  render={({ field }) => {
                    const fullOptions: DropdownOption[] = liquidSelectionOptions.map(
                      option => {
                        const liquid = liquids.find(
                          liquid => liquid.ingredientId === option.value
                        )

                        return {
                          name: option.name,
                          value: option.value,
                          liquidColor: liquid?.displayColor ?? '',
                        }
                      }
                    )
                    const selectedLiquid = fullOptions.find(
                      option => option.value === selectedLiquidId
                    )
                    const selectLiquidIdName = selectedLiquid?.name
                    const selectLiquidColor = selectedLiquid?.liquidColor

                    return (
                      <DropdownMenu
                        width="254px"
                        dropdownType="neutral"
                        filterOptions={fullOptions}
                        currentOption={{
                          value: selectedLiquidId ?? '',
                          name: selectLiquidIdName ?? '',
                          liquidColor: selectLiquidColor,
                        }}
                        onClick={field.onChange}
                      />
                    )
                  }}
                />
              </Flex>

              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {t('liquid_volume')}
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
                    {t('shared:cancel')}
                  </StyledText>
                </Btn>
                <PrimaryButton
                  disabled={
                    volumeErrors != null ||
                    volume == null ||
                    volume === '' ||
                    selectedLiquidId == null ||
                    selectedLiquidId === ''
                  }
                  type="submit"
                >
                  {t('save')}
                </PrimaryButton>
              </Flex>
            </Flex>
          ) : null}
        </ListItem>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          marginTop={SPACING.spacing24}
        >
          {liquidInfo.length > 0 ? (
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('liquids_added')}
            </StyledText>
          ) : null}
          {liquidInfo.map(info => {
            return <LiquidCard key={info.liquidIndex} info={info} />
          })}
        </Flex>
      </form>
    </Toolbox>
  )
}
