import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Banner,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DropdownMenu,
  Flex,
  InputField,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
  TertiaryButton,
  TYPOGRAPHY,
} from '@opentrons/components'

import * as labwareIngredActions from '../../../labware-ingred/actions'
import {
  removeWellsContents,
  setWellContents,
} from '../../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import { getLiquidClassDisplayName } from '../../../liquid-defs/utils'
import { getLiquidEntities } from '../../../step-forms/selectors'
import * as fieldProcessors from '../../../steplist/fieldLevel/processing'
import * as wellContentsSelectors from '../../../top-selectors/well-contents'
import { deselectAllWells } from '../../../well-selection/actions'
import { getSelectedWells } from '../../../well-selection/selectors'
import { LINK_BUTTON_STYLE } from '../../atoms'
import { DefineLiquidsModal } from '../DefineLiquidsModal'
import { LiquidCard } from './LiquidCard'
import { NoLiquid } from './NoLiquid'

import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import type { DropdownOption } from '@opentrons/components'
import type { ContentsByWell } from '../../../labware-ingred/types'

export interface LiquidInfo {
  name: string
  color: string
  liquidIndex: string
  liquidClassDisplayName: string | null
}

interface ValidFormValues {
  selectedLiquidId: string
  volume: string
}

interface LiquidFormValues {
  selectedLiquidId?: string | null
  volume?: string | null
}

const LIQUID_CONTAINER_WIDTH = '15rem'

interface LiquidContainerProps {
  showBadFormState: boolean
  setShowBadFormState: Dispatch<SetStateAction<boolean>>
}

export function LiquidEditor({
  showBadFormState,
  setShowBadFormState,
}: LiquidContainerProps): JSX.Element {
  const { t } = useTranslation(['liquids', 'form', 'shared'])
  const dispatch = useDispatch()
  const [showDefineLiquidModal, setDefineLiquidModal] = useState<boolean>(false)
  const liquids = useSelector(getLiquidEntities)
  const labwareId = useSelector(labwareIngredSelectors.getSelectedLabwareId)
  const selectedWellGroups = useSelector(getSelectedWells)
  const selectedWells = Object.keys(selectedWellGroups)
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
    formState,
  } = useForm<LiquidFormValues>({
    defaultValues: getInitialValues(),
  })

  const { errors: fieldErrors } = formState

  const selectedLiquidId = watch('selectedLiquidId')
  const volume = watch('volume')

  const handleCancelForm = (): void => {
    dispatch(deselectAllWells())
    setShowBadFormState(false)
    reset()
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
    dispatch(deselectAllWells())
    setShowBadFormState(false)
    reset()
  }

  const handleChangeVolume: (e: ChangeEvent<HTMLInputElement>) => void = e => {
    const value: string | null | undefined = e.currentTarget.value
    const masked = fieldProcessors.composeMaskers(
      fieldProcessors.maskToFloat,
      fieldProcessors.onlyPositiveNumbers,
      fieldProcessors.trimDecimals(1)
    )(value) as string
    setValue('volume', masked)
  }

  const handleSaveForm = (values: LiquidFormValues): void => {
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
    setShowBadFormState(false)
  }

  const handleSaveSubmit: (values: LiquidFormValues) => void = values => {
    handleSaveForm(values)
    reset()
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

  const liquidInfo: LiquidInfo[] = uniqueLiquids
    .map(liquid => {
      const foundLiquid = Object.values(liquids).find(
        id => id.liquidGroupId === liquid
      )
      return {
        liquidIndex: liquid,
        name: foundLiquid?.displayName ?? '',
        color: foundLiquid?.displayColor ?? '',
        liquidClassDisplayName: getLiquidClassDisplayName(
          foundLiquid?.liquidClass ?? null
        ),
      }
    })
    .filter(Boolean)
  return (
    <Flex width={LIQUID_CONTAINER_WIDTH}>
      {showDefineLiquidModal ? (
        <DefineLiquidsModal
          onClose={() => {
            setDefineLiquidModal(false)
          }}
        />
      ) : null}

      {(liquidsInLabware != null && liquidsInLabware.length > 0) ||
      selectedWells.length > 0 ? (
        <form onSubmit={handleSubmit(handleSaveSubmit)}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing24}
            width="100%"
          >
            {selectedWells.length > 0 ? (
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
                <ListItem type={showBadFormState ? 'error' : 'default'}>
                  <Flex
                    padding={SPACING.spacing12}
                    gridGap={SPACING.spacing12}
                    flexDirection={DIRECTION_COLUMN}
                    width="100%"
                  >
                    <StyledText desktopStyle="bodyDefaultSemiBold">
                      {t('add_liquid')}
                    </StyledText>
                    {liquidSelectionOptions.length === 0 ? (
                      <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
                        <Flex
                          justifyContent={JUSTIFY_SPACE_BETWEEN}
                          width="100%"
                        >
                          <StyledText desktopStyle="captionRegular">
                            {t('no_liquids_defined')}
                          </StyledText>
                          <Btn
                            textDecoration={TYPOGRAPHY.textDecorationUnderline}
                            onClick={() => {
                              setDefineLiquidModal(true)
                              dispatch(
                                labwareIngredActions.createNewLiquidGroup()
                              )
                            }}
                          >
                            <StyledText desktopStyle="captionRegular">
                              {t('define_liquid')}
                            </StyledText>
                          </Btn>
                        </Flex>
                      </Banner>
                    ) : null}
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      gridGap={SPACING.spacing8}
                    >
                      <Controller
                        name="selectedLiquidId"
                        control={control}
                        rules={{
                          required: {
                            value: true,
                            message: t('liquids:liquid_required'),
                          },
                        }}
                        render={({ field }) => {
                          const fullOptions: DropdownOption[] = liquidSelectionOptions.map(
                            option => {
                              const liquid = Object.values(liquids).find(
                                liquid => liquid.liquidGroupId === option.value
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
                              title={t('liquid')}
                              width="100%"
                              disabled={liquidSelectionOptions.length === 0}
                              dropdownType="neutral"
                              filterOptions={fullOptions}
                              currentOption={{
                                value: selectedLiquidId ?? '',
                                name: selectLiquidIdName ?? '',
                                liquidColor: selectLiquidColor,
                              }}
                              onClick={field.onChange}
                              menuPlacement="bottom"
                              error={fieldErrors.selectedLiquidId?.message}
                            />
                          )
                        }}
                      />
                    </Flex>

                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      gridGap={SPACING.spacing8}
                    >
                      <StyledText desktopStyle="bodyDefaultRegular">
                        {t('liquid_volume')}
                      </StyledText>
                      <Controller
                        name="volume"
                        control={control}
                        rules={{
                          required: {
                            value: true,
                            message: t('liquids:liquid_volume_required'),
                          },
                          min: {
                            value: 0.1,
                            message: t(t('liquid_volume_nonzero')),
                          },
                          max: {
                            value: selectedWellsMaxVolume,
                            message: t(
                              'form:liquid_placement.errors.volume_exceeded',
                              { volume: selectedWellsMaxVolume }
                            ),
                          },
                        }}
                        render={({ field }) => (
                          <InputField
                            name="volume"
                            units={t('application:units.microliter')}
                            value={volume ? Number(volume) : null}
                            error={fieldErrors.volume?.message}
                            onBlur={field.onBlur}
                            onChange={handleChangeVolume}
                          />
                        )}
                      />
                    </Flex>
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      gap={SPACING.spacing8}
                    >
                      <Flex justifyContent={JUSTIFY_END}>
                        <TertiaryButton
                          onClick={() => {
                            handleClearSelectedWells()
                          }}
                          buttonType="white"
                        >
                          <StyledText desktopStyle="bodyDefaultSemiBold">
                            {t('liquids:clear_selected_wells')}
                          </StyledText>
                        </TertiaryButton>
                      </Flex>
                      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
                        <Btn
                          textDecoration={TYPOGRAPHY.textDecorationUnderline}
                          onClick={handleCancelForm}
                          padding={SPACING.spacing4}
                          css={LINK_BUTTON_STYLE}
                        >
                          <StyledText desktopStyle="bodyDefaultRegular">
                            {t('shared:cancel')}
                          </StyledText>
                        </Btn>

                        <TertiaryButton type="submit" buttonType="primary">
                          <StyledText desktopStyle="bodyDefaultSemiBold">
                            {t('save')}
                          </StyledText>
                        </TertiaryButton>
                      </Flex>
                    </Flex>
                  </Flex>
                </ListItem>
                {showBadFormState ? (
                  <StyledText
                    desktopStyle="bodyDefaultRegular"
                    color={COLORS.red50}
                  >
                    {t('liquids:save_or_cancel')}
                  </StyledText>
                ) : null}
              </Flex>
            ) : null}
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing8}
              width={LIQUID_CONTAINER_WIDTH}
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
          </Flex>
        </form>
      ) : (
        <NoLiquid />
      )}
    </Flex>
  )
}
