import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  Banner,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DropdownMenu,
  Flex,
  InfoScreen,
  InputField,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
  TertiaryButton,
  Toolbox,
  TYPOGRAPHY,
} from '@opentrons/components'
import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { analyticsEvent } from '/protocol-designer/analytics/actions'
import { LINK_BUTTON_STYLE } from '/protocol-designer/components/atoms'
import * as labwareIngredActions from '/protocol-designer/labware-ingred/actions'
import {
  removeWellsContents,
  setWellContents,
} from '/protocol-designer/labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '/protocol-designer/labware-ingred/selectors'
import { getLiquidClassDisplayName } from '/protocol-designer/liquid-defs/utils'
import {
  getInitialDeckSetup,
  getLiquidEntities,
} from '/protocol-designer/step-forms/selectors'
import * as fieldProcessors from '/protocol-designer/steplist/fieldLevel/processing'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'
import { deselectAllWells } from '/protocol-designer/well-selection/actions'
import { getSelectedWells } from '/protocol-designer/well-selection/selectors'

import { LiquidCard } from './LiquidCard'

import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react'
import type { DropdownOption, WellGroup } from '@opentrons/components'
import type {
  LabwareLiquidState,
  LiquidEntities,
} from '@opentrons/step-generation'
import type { ContentsByWell } from '/protocol-designer/labware-ingred/types'

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

interface ToolboxFormValues {
  selectedLiquidId?: string | null
  volume?: string | null
}

interface LiquidToolboxData {
  liquids: LiquidEntities
  labwareId: string | null
  selectedWellGroups: WellGroup
  nickNames: Record<string, string>
  liquidLocations: LabwareLiquidState
  commonSelectedLiquidId: string | null
  commonSelectedVolume: number | null
  selectedWellsMaxVolume: number | null
  liquidSelectionOptions: DropdownOption[]
  allWellContentsForActiveItem: wellContentsSelectors.WellContentsByLabware | null
}

interface LiquidToolboxProps {
  showBadFormState: boolean
  setShowBadFormState: Dispatch<SetStateAction<boolean>>
  setDefineLiquidModal: Dispatch<SetStateAction<boolean>>
  showLiquidLayoutOverlay: boolean
  data: LiquidToolboxData
  selectedLabwareIds: string[]
}
function LiquidToolbox({
  showBadFormState,
  setShowBadFormState,
  setDefineLiquidModal,
  selectedLabwareIds,
  showLiquidLayoutOverlay,
  data,
}: LiquidToolboxProps): ReactNode {
  const { t } = useTranslation(['liquids', 'form', 'shared'])
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    liquids,
    labwareId,
    selectedWellGroups,
    nickNames,
    liquidLocations,
    commonSelectedLiquidId,
    commonSelectedVolume,
    selectedWellsMaxVolume,
    liquidSelectionOptions,
    allWellContentsForActiveItem,
  } = data

  const selectedWells = Object.keys(selectedWellGroups)
  const labwareDisplayName = labwareId != null ? nickNames[labwareId] : ''

  const allWellsForActiveItem =
    labwareId != null
      ? Object.keys(allWellContentsForActiveItem?.[labwareId] ?? {})
      : []
  const activeItemHasLiquids =
    labwareId != null
      ? Object.values(allWellContentsForActiveItem?.[labwareId] ?? {}).some(
          value => value.groupIds.length > 0
        )
      : false

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

  const { handleSubmit, watch, control, setValue, reset, formState } =
    useForm<ToolboxFormValues>({
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

  const handleClearAllWells: () => void = () => {
    if (
      global.confirm(t('application:are_you_sure_clear_all_wells') as string)
    ) {
      for (const labwareId of selectedLabwareIds) {
        if (labwareId != null && activeItemHasLiquids) {
          dispatch(
            removeWellsContents({
              labwareId,
              wells: allWellsForActiveItem,
            })
          )
        }
      }
    }
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
          labwareId: selectedLabwareIds,
          wells: selectedWells ?? [],
          volume: Number(values.volume),
        })
      )
    }
    setShowBadFormState(false)
  }

  const handleSaveSubmit: (values: ToolboxFormValues) => void = values => {
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

  const hasLiquids =
    wellContents != null
      ? Object.values(wellContents).flatMap(content => content.groupIds)
          .length > 0
      : false
  const hasSelection = selectedWells.length > 0
  const canEdit = !showLiquidLayoutOverlay && (hasLiquids || hasSelection)
  const { labware, modules } = useSelector(getInitialDeckSetup)
  const stackerModuleIds = Object.entries(modules).reduce<string[]>(
    (stackerIds, [moduleId, moduleOnDeck]) => {
      return moduleOnDeck.type === FLEX_STACKER_MODULE_TYPE
        ? stackerIds.concat(moduleId)
        : stackerIds
    },
    []
  )

  const labwareOnStackerWithLiquid = Object.entries(labware).filter(
    ([, labwareInfo]) =>
      labwareInfo.stack != null &&
      stackerModuleIds.some(stackerId => labwareInfo.stack.includes(stackerId))
  )
  const handleConfirmClick = (): void => {
    if (labwareOnStackerWithLiquid.length > 0) {
      dispatch(
        analyticsEvent({
          name: 'liquidInLabwareInStacker',
          properties: {},
        })
      )
    }
    if (selectedWells.length > 0) {
      setShowBadFormState(true)
      return
    }

    dispatch(deselectAllWells())
    navigate('/designer')
  }

  return (
    <>
      <Toolbox
        title={
          <StyledText desktopStyle="bodyLargeSemiBold">
            {labwareDisplayName}
          </StyledText>
        }
        onCloseClick={handleClearAllWells}
        height="100%"
        width="21.875rem"
        confirmButtonText={t('shared:done')}
        onConfirmClick={handleConfirmClick}
        closeButton={
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('clear_wells')}
          </StyledText>
        }
      >
        {canEdit ? (
          <form onSubmit={handleSubmit(handleSaveSubmit)}>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
              {selectedWells.length > 0 ? (
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing8}
                >
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
                        <Banner
                          type="warning"
                          iconMarginLeft={SPACING.spacing4}
                        >
                          <Flex
                            justifyContent={JUSTIFY_SPACE_BETWEEN}
                            width="100%"
                          >
                            <StyledText desktopStyle="captionRegular">
                              {t('no_liquids_defined')}
                            </StyledText>
                            <Btn
                              textDecoration={
                                TYPOGRAPHY.textDecorationUnderline
                              }
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
                            const fullOptions: DropdownOption[] =
                              liquidSelectionOptions.map(option => {
                                const liquid = Object.values(liquids).find(
                                  liquid =>
                                    liquid.liquidGroupId === option.value
                                )

                                return {
                                  name: option.name,
                                  value: option.value,
                                  liquidColor: liquid?.displayColor ?? '',
                                }
                              })
                            const selectedLiquid = fullOptions.find(
                              option => option.value === selectedLiquidId
                            )
                            const selectLiquidIdName = selectedLiquid?.name
                            const selectLiquidColor =
                              selectedLiquid?.liquidColor

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
                              value: selectedWellsMaxVolume ?? 0,
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
                        <TertiaryButton type="submit" buttonType="primary">
                          <StyledText desktopStyle="bodyDefaultSemiBold">
                            {t('save')}
                          </StyledText>
                        </TertiaryButton>
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
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
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
          <InfoScreen
            content={t('no_liquids_defined')}
            subContent={t('select_wells_to_add')}
          />
        )}
      </Toolbox>
    </>
  )
}

interface LiquidToolboxContainerProps {
  showBadFormState: boolean
  setShowBadFormState: Dispatch<SetStateAction<boolean>>
  setDefineLiquidModal: Dispatch<SetStateAction<boolean>>
  showLiquidLayoutOverlay: boolean
}

export function LiquidToolboxContainer({
  showBadFormState,
  setShowBadFormState,
  setDefineLiquidModal,
  showLiquidLayoutOverlay,
}: LiquidToolboxContainerProps): ReactNode {
  // All selectors moved here
  const liquids = useSelector(getLiquidEntities)
  const multipleSelectedLabwareIds = useSelector(
    labwareIngredSelectors.getSelectedLabwareIds
  )
  const selectedLabwareId = useSelector(
    labwareIngredSelectors.getSelectedLabwareId
  )
  const labwareId = useSelector(labwareIngredSelectors.getSelectedLabwareId)
  const selectedWellGroups = useSelector(getSelectedWells)
  const nickNames = useSelector(getLabwareNicknamesById)
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

  const data: LiquidToolboxData = {
    liquids,
    labwareId: labwareId ?? null,
    selectedWellGroups: selectedWellGroups ?? {},
    nickNames,
    liquidLocations,
    commonSelectedLiquidId: commonSelectedLiquidId ?? null,
    commonSelectedVolume: commonSelectedVolume ?? null,
    selectedWellsMaxVolume: selectedWellsMaxVolume ?? null,
    liquidSelectionOptions,
    allWellContentsForActiveItem,
  }

  return (
    <LiquidToolbox
      showBadFormState={showBadFormState}
      setShowBadFormState={setShowBadFormState}
      setDefineLiquidModal={setDefineLiquidModal}
      showLiquidLayoutOverlay={showLiquidLayoutOverlay}
      data={data}
      selectedLabwareIds={
        !multipleSelectedLabwareIds?.includes(selectedLabwareId ?? '')
          ? [selectedLabwareId ?? '']
          : multipleSelectedLabwareIds
      }
    />
  )
}
