import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  DISPLAY_FLEX,
  Icon,
  InfoScreen,
  JUSTIFY_CENTER,
  SecondaryButton,
  SPACING,
  StyledText,
  Toolbox,
} from '@opentrons/components'
import { FLEX_STACKER_MODULE_V1, getMaxPoolCount } from '@opentrons/shared-data'
import {
  getFullStackFromLabwares,
  getLargestStackInSlot,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import { getInitialRobotState } from '/protocol-designer/file-data/selectors'
import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import {
  createContainer,
  multipleIngredientsSelector,
  openIngredientSelector,
} from '/protocol-designer/labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '/protocol-designer/labware-ingred/selectors'
import { createContainerAboveModule } from '/protocol-designer/step-forms/actions/thunks'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { LabwareButtonBasket } from '../../molecules'
import { useKitchen } from '../Kitchen/useKitchen'
import styles from './labwareToolbox.module.css'
import {
  getStackerModuleStateFromSlot,
  getStackLimitFromDef,
  getTopDownPrimaryLabwareInHopper,
} from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type { LabwareLiquidState } from '@opentrons/step-generation'
import type { LabwareOnDeck } from '/protocol-designer/step-forms'
import type { ThunkDispatch } from '/protocol-designer/types'

export interface LiquidInfo {
  name: string
  color: string
  liquidIndex: string
  liquidClassDisplayName: string | null
}

interface LabwareStackToolboxData {
  labware: {
    [labwareId: string]: LabwareOnDeck
  }
  labwareId: string | null
  liquidLocations: LabwareLiquidState
  largestStackInSlot: string[]
}

interface LabwareStackToolboxProps {
  showBadFormState: boolean
  setShowBadFormState: Dispatch<SetStateAction<boolean>>
  setDefineLiquidModal: Dispatch<SetStateAction<boolean>>
  setShowLiquidLayoutOverlay: Dispatch<SetStateAction<boolean>>
  data: LabwareStackToolboxData
  selectedLabwareIds: string[] | null
  slot: string
}
export function LabwareStackToolbox({
  setShowLiquidLayoutOverlay,
  data,
  selectedLabwareIds,
  slot,
}: LabwareStackToolboxProps): JSX.Element | null {
  const { t } = useTranslation(['liquids', 'form', 'shared'])
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { makeSnackbar } = useKitchen()
  const labwareDefsByURI = useSelector(getLabwareDefsByURI)

  const { labware, labwareId, liquidLocations } = data
  const { modules } = useSelector(getInitialDeckSetup)

  const stackerModuleState =
    labwareId != null ? getStackerModuleStateFromSlot({ slot, modules }) : null
  let stackLimit: number = 0
  let topDownStackIds: string[] = []

  // for hopper primary labware
  if (stackerModuleState != null) {
    const { storedLabwareDetails } = stackerModuleState ?? {}
    stackLimit = getMaxPoolCount({
      labwareDefinitions: {
        primary:
          labwareDefsByURI[storedLabwareDetails?.primaryLabwareURI ?? ''],
        adapter:
          labwareDefsByURI[storedLabwareDetails?.adapterLabwareURI ?? ''] ??
          null,
        lid:
          labwareDefsByURI[storedLabwareDetails?.lidLabwareURI ?? ''] ?? null,
      },
      model: FLEX_STACKER_MODULE_V1,
    })
    topDownStackIds = getTopDownPrimaryLabwareInHopper({
      slot,
      modules,
    })
    // for on-deck labware
  } else if (labwareId != null && labware[labwareId]?.def != null) {
    stackLimit = getStackLimitFromDef(labware[labwareId].def)
    topDownStackIds = getFullStackFromLabwares(labware, labwareId)
  }

  // select the top labware in the stack if no selected labware ids are provided
  // FIXME(2026-03-03): Investigate this error about the useEffect firing on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedLabware =
    selectedLabwareIds != null ? selectedLabwareIds : [topDownStackIds[0]]

  useEffect(() => {
    if (selectedLabware[0] != null) {
      dispatch(openIngredientSelector(selectedLabware[0]))
    }
  }, [selectedLabware, dispatch])

  if (labwareId == null) {
    console.error('No labware ID found for LabwareStackToolbox')
    return null
  }

  const handleAddAnotherLabware = (): void => {
    if (topDownStackIds.length < stackLimit && labwareId != null) {
      // create labware groups for hopper
      if (stackerModuleState?.storedLabwareDetails != null) {
        const { storedLabwareDetails } = stackerModuleState
        dispatch(
          createContainerAboveModule({
            slot,
            labwareDefURIGroup: {
              adapterDefURI: storedLabwareDetails.adapterLabwareURI ?? null,
              topLabwareDefURI: storedLabwareDetails.primaryLabwareURI,
              lidDefURI: storedLabwareDetails.lidLabwareURI ?? null,
            },
            stackerInfo: {
              stackerPosition: 'hopper',
              amount: 1,
            },
          })
        )
        // add on-deck labware
      } else if (labware[labwareId].labwareDefURI) {
        dispatch(
          createContainer({
            labwareDefURIStack: [labware[labwareId]?.labwareDefURI ?? ''],
            slot: labwareId,
            updateSelectedLabwareId: true,
          })
        )
      }
    } else {
      makeSnackbar(t('no_more_space_in_slot') as string)
    }
  }

  const allLabwareLiquidsEqual = (arr: string[]): boolean => {
    const firstValue =
      liquidLocations != null ? liquidLocations[topDownStackIds[0]] : null

    if (!firstValue) {
      return true
    }
    return arr.every(
      item =>
        item in liquidLocations &&
        JSON.stringify(liquidLocations[item]) === JSON.stringify(firstValue)
    )
  }

  const handleSelectAllLabware = (): void => {
    dispatch(multipleIngredientsSelector(topDownStackIds))
    if (!allLabwareLiquidsEqual(topDownStackIds)) {
      setShowLiquidLayoutOverlay(true)
    }
  }

  const handleAssignToLabware = (
    newItem: string,
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    const isMultiSelect = event.metaKey || event.ctrlKey

    if (isMultiSelect) {
      const newSelection = [
        ...(selectedLabwareIds ?? [topDownStackIds[0]]),
        newItem,
      ]
      dispatch(multipleIngredientsSelector(newSelection))

      // Show overlay if selected labware have different liquid layouts
      const hasDifferentLiquids =
        labwareId != null &&
        JSON.stringify(liquidLocations[newItem]) !==
          JSON.stringify(liquidLocations[labwareId])
      if (hasDifferentLiquids) {
        setShowLiquidLayoutOverlay(true)
      }
    } else {
      dispatch(multipleIngredientsSelector([newItem]))
    }
  }

  return (
    <Toolbox
      width="14.6875rem"
      title={
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('stacker_labware')}
        </StyledText>
      }
      onCloseClick={handleSelectAllLabware}
      height="100%"
      confirmButton={
        <SecondaryButton
          display={DISPLAY_FLEX}
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing8}
          width="100%"
          onClick={handleAddAnotherLabware}
        >
          <Icon size="1.5rem" name="plus" />
          <StyledText desktopStyle="bodyDefaultSemiBold" display="inline-block">
            {t('add_another_labware')}
          </StyledText>
        </SecondaryButton>
      }
      closeButton={
        <StyledText
          desktopStyle="bodyDefaultRegular"
          onClick={handleSelectAllLabware}
        >
          {t('select_all')}
        </StyledText>
      }
    >
      {topDownStackIds.length > 0 ? (
        <div className={styles.container}>
          <LabwareButtonBasket
            stackOfLabware={topDownStackIds}
            labware={labware}
            setSelectedLabware={handleAssignToLabware}
            selectedLabware={selectedLabware}
          />
        </div>
      ) : (
        <InfoScreen
          content={t('no_liquids_defined')}
          subContent={t('select_wells_to_add')}
        />
      )}
    </Toolbox>
  )
}

interface LabwareStackToolboxContainerProps {
  showBadFormState: boolean
  setShowBadFormState: Dispatch<SetStateAction<boolean>>
  setDefineLiquidModal: Dispatch<SetStateAction<boolean>>
  setShowLiquidLayoutOverlay: Dispatch<SetStateAction<boolean>>
  selectedLabwareIds: string[] | null
}

export function LabwareStackToolboxContainer({
  showBadFormState,
  setShowBadFormState,
  setDefineLiquidModal,
  selectedLabwareIds,
  setShowLiquidLayoutOverlay,
}: LabwareStackToolboxContainerProps): JSX.Element {
  // All selectors moved here
  const labwareId = useSelector(labwareIngredSelectors.getSelectedLabwareId)
  const { labware } = useSelector(getInitialDeckSetup)
  const initialRobotState = useSelector(getInitialRobotState)

  const labwareStack: string[] =
    labwareId != null ? (labware[labwareId]?.stack ?? []) : []
  const slot = getSlotInLocationStack(labwareStack)

  const largestStackInSlot = getLargestStackInSlot({
    slot,
    labwareState: initialRobotState.labware,
    modulesState: initialRobotState.modules,
  })

  const liquidLocations = useSelector(
    labwareIngredSelectors.getLiquidsByLabwareId
  )
  const data: LabwareStackToolboxData = {
    labwareId: labwareId ?? null,
    labware,
    liquidLocations,
    largestStackInSlot,
  }

  return (
    <LabwareStackToolbox
      setShowLiquidLayoutOverlay={setShowLiquidLayoutOverlay}
      showBadFormState={showBadFormState}
      setShowBadFormState={setShowBadFormState}
      setDefineLiquidModal={setDefineLiquidModal}
      selectedLabwareIds={selectedLabwareIds}
      data={data}
      slot={slot}
    />
  )
}
