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

import {
  createContainer,
  multipleIngredientsSelector,
} from '/protocol-designer/labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '/protocol-designer/labware-ingred/selectors'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'

import { LabwareButtonBasket } from '../../molecules'
import { useKitchen } from '../Kitchen/useKitchen'
import { getHopperStackLimit } from '../SelectLabwareModal/utils'
import styles from './labwareToolbox.module.css'

import type { Dispatch, SetStateAction } from 'react'
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
  allWellContents: Record<string, any>
}

interface LabwareStackToolboxProps {
  showBadFormState: boolean
  setShowBadFormState: Dispatch<SetStateAction<boolean>>
  setDefineLiquidModal: Dispatch<SetStateAction<boolean>>
  setShowLiquidLayoutOverlay: Dispatch<SetStateAction<boolean>>
  data: LabwareStackToolboxData
  selectedLabwareIds: string[]
}
export function LabwareStackToolbox({
  setShowLiquidLayoutOverlay,
  data,
  selectedLabwareIds,
}: LabwareStackToolboxProps): JSX.Element {
  const { t } = useTranslation(['liquids', 'form', 'shared'])
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { makeSnackbar } = useKitchen()

  const { labware, labwareId, allWellContents } = data
  const labwareStack: string[] =
    labwareId != null ? (labware[labwareId]?.stack ?? []) : []
  const filteredLabwareStack = labwareStack.filter(id => labware[id] != null)
  const zHeight =
    labwareId != null ? labware[labwareId].def.dimensions.zDimension : 0
  const hopperStackLimit = getHopperStackLimit(zHeight)
  const handleAddAnotherLabware = (): void => {
    if (filteredLabwareStack.length < hopperStackLimit) {
      dispatch(
        createContainer({
          labwareDefURIStack: [labware[labwareId ?? '']?.labwareDefURI ?? ''],
          slot: labwareId ?? '',
          updateSelectedLabwareId: true,
        })
      )
    } else {
      makeSnackbar(t('no_more_space_in_slot') as string)
    }
  }

  const handleSelectAllLabware = (): void => {
    const currentLiquidContents = labwareId && allWellContents[labwareId]
    const allEqual = filteredLabwareStack.every(
      item =>
        JSON.stringify(allWellContents[item]) ===
        JSON.stringify(currentLiquidContents)
    )

    if (!allEqual) {
      setShowLiquidLayoutOverlay(true)
      return
    }
    dispatch(multipleIngredientsSelector(filteredLabwareStack))
  }

  const handleAssignToLabware = (
    newItem: string,
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    if (
      labwareId &&
      (event.metaKey || event.ctrlKey) &&
      JSON.stringify(allWellContents[newItem]) !==
        JSON.stringify(allWellContents[labwareId])
    ) {
      // selected labware have different liquid layouts
      setShowLiquidLayoutOverlay(true)
    } else if (event.metaKey || event.ctrlKey) {
      dispatch(multipleIngredientsSelector([...selectedLabwareIds, newItem]))
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
          data-testid="Toolbox_confirmButton"
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
      {filteredLabwareStack.length > 0 ? (
        <div className={styles.container}>
          <LabwareButtonBasket
            stackOfLabware={filteredLabwareStack}
            labware={labware}
            setSelectedLabware={handleAssignToLabware}
            selectedLabware={selectedLabwareIds}
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
  selectedLabwareIds: string[]
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
  const allWellContents = useSelector(
    wellContentsSelectors.getWellContentsForLabwareStack
  )

  const data: LabwareStackToolboxData = {
    labwareId: labwareId ?? null,
    labware,
    allWellContents,
  }

  return (
    <LabwareStackToolbox
      setShowLiquidLayoutOverlay={setShowLiquidLayoutOverlay}
      showBadFormState={showBadFormState}
      setShowBadFormState={setShowBadFormState}
      setDefineLiquidModal={setDefineLiquidModal}
      selectedLabwareIds={selectedLabwareIds}
      data={data}
    />
  )
}
