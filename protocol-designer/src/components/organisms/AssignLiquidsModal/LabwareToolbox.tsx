import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
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
import {
  getInitialDeckSetup,
  getLabwareEntities,
} from '/protocol-designer/step-forms/selectors'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'

import { LabwareButtonBasket } from '../../molecules'

import type { Dispatch, SetStateAction } from 'react'
import type { LabwareEntities } from '@opentrons/step-generation'
import type { ThunkDispatch } from '/protocol-designer/types'

export interface LiquidInfo {
  name: string
  color: string
  liquidIndex: string
  liquidClassDisplayName: string | null
}

interface LabwareStackToolboxData {
  labwareEntities: LabwareEntities
  labware: Record<string, any>
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

  const { labware, labwareId, allWellContents, labwareEntities } = data

  const labwareStack: string[] =
    labwareId != null ? labware[labwareId]?.stack ?? [] : []

  const handleAddAnotherLabware = (): void => {
    dispatch(
      createContainer({
        labwareDefURIStack: [
          labwareEntities[labwareId ?? '']?.labwareDefURI ?? '',
        ],
        slot: labwareId ?? '',
        updateSelectedLabwareId: true,
      })
    )
  }

  const handleSelectAllLabware = (): void => {
    const currentLiquidContents = labwareId && allWellContents[labwareId]
    const allEqual = labwareStack.every(
      item =>
        JSON.stringify(allWellContents[item]) ===
        JSON.stringify(currentLiquidContents)
    )

    if (!allEqual) {
      setShowLiquidLayoutOverlay(true)
      return
    }
    dispatch(multipleIngredientsSelector(labwareStack))
  }

  const handleAssignToLabware = (
    newItem: string,
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    console.log('newItem', newItem)
    if (
      labwareId &&
      (event.metaKey || event.ctrlKey) &&
      JSON.stringify(allWellContents[newItem]) !==
        JSON.stringify(allWellContents[labwareId])
    ) {
      console.error('selected labware have different liquid layouts')
      setShowLiquidLayoutOverlay(true)
    } else if (event.metaKey || event.ctrlKey) {
      dispatch(multipleIngredientsSelector([...selectedLabwareIds, newItem]))
    } else {
      dispatch(multipleIngredientsSelector([newItem]))
    }
  }

  const CSSStyle = css`
    flex-direction: ${DIRECTION_COLUMN};
    width: 224px;
  `

  return (
    <>
      <Toolbox
        width="235px"
        title={
          <StyledText desktopStyle="bodyLargeSemiBold">
            Stacker Labware
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
            <StyledText
              desktopStyle="bodyDefaultSemiBold"
              display="inline-block"
            >
              Add another labware
            </StyledText>
          </SecondaryButton>
        }
        closeButton={
          <StyledText
            desktopStyle="bodyDefaultRegular"
            onClick={handleSelectAllLabware}
          >
            Select all
          </StyledText>
        }
      >
        {labwareStack.length > 0 ? (
          <div css={CSSStyle}>
            <LabwareButtonBasket
              stackOfLabware={labwareStack}
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
    </>
  )
}

interface LiquidToolboxContainerProps {
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
}: LiquidToolboxContainerProps): JSX.Element {
  // All selectors moved here
  const labwareEntities = useSelector(getLabwareEntities)
  const labwareId = useSelector(labwareIngredSelectors.getSelectedLabwareId)
  const labwareIds =
    useSelector(labwareIngredSelectors.getSelectedLabwareIds) ?? []
  console.log('labwareIds', labwareIds)
  const { labware } = useSelector(getInitialDeckSetup)
  console.log('labware:', labware)
  const allWellContents = useSelector(
    wellContentsSelectors.getWellContentsForLabwareStack
  )

  const data: LabwareStackToolboxData = {
    labwareEntities,
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
