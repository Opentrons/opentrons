import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  DIRECTION_COLUMN,
  Flex,
  Icon,
  InfoScreen,
  SecondaryButton,
  StyledText,
  Toolbox,
} from '@opentrons/components'

import { openIngredientsSelector } from '/protocol-designer/labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '/protocol-designer/labware-ingred/selectors'
import {
  getInitialDeckSetup,
  getLabwareEntities,
} from '/protocol-designer/step-forms/selectors'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'

import { LabwareButtonBasket } from '../../molecules'

import type { Dispatch, SetStateAction } from 'react'
import type { LabwareEntities } from '@opentrons/step-generation'

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
  setSelectedLabware: Dispatch<SetStateAction<string[]>>
}
export function LabwareStackToolbox({
  setShowLiquidLayoutOverlay,
  data,
  selectedLabwareIds,
  setSelectedLabware,
}: LabwareStackToolboxProps): JSX.Element {
  const { t } = useTranslation(['liquids', 'form', 'shared'])
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { labware, labwareId, allWellContents } = data

  const labwareStack: string[] =
    labwareId != null ? labware[labwareId]?.stack ?? [] : []

  const handleConfirmClick = (): void => {
    navigate('/designer')
  }

  const handleSelectAllLabware = (): void => {
    const currentLiquidContents = labwareId && allWellContents[labwareId]
    const allEqual = labwareStack.every(
      item =>
        JSON.stringify(allWellContents[item]) ===
        JSON.stringify(currentLiquidContents)
    )

    console.log('allEqual', allEqual)
    if (!allEqual) {
      setShowLiquidLayoutOverlay(true)
      return
    }
    dispatch(openIngredientsSelector(labwareStack))
    setSelectedLabware(labwareStack)
  }

  const handleAssignToLabware = (
    newItem: string,
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    console.log('newItem', newItem)
    console.log('labwareId', labwareId)
    console.log('allWellContents[newItem]', allWellContents[newItem])
    console.log('allWellContents[labwareId]', allWellContents[labwareId])
    console.log('selectedLabwareIds', selectedLabwareIds)
    if (
      labwareId &&
      (event.metaKey || event.ctrlKey) &&
      JSON.stringify(allWellContents[newItem]) !==
        JSON.stringify(allWellContents[labwareId])
    ) {
      console.error('selected labware have different liquid layouts')
      setShowLiquidLayoutOverlay(true)
    } else if (event.metaKey || event.ctrlKey) {
      console.log('newItem with ctrl key')
      setSelectedLabware(prevItems => [...prevItems, newItem])
      dispatch(openIngredientsSelector([...selectedLabwareIds, newItem]))
      console.log('selectedLabwareIds', selectedLabwareIds)
    } else {
      console.log('newItem')
      setSelectedLabware([newItem])
    }
  }

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
            width="100%"
            data-testid="Toolbox_confirmButton"
            onClick={handleConfirmClick}
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
          <Flex flexDirection={DIRECTION_COLUMN} width="224px">
            <LabwareButtonBasket
              stackOfLabware={labwareStack}
              labware={labware}
              setSelectedLabware={handleAssignToLabware}
              selectedLabware={selectedLabwareIds}
            />
          </Flex>
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
  setSelectedLabware: Dispatch<SetStateAction<string[]>>
}

export function LabwareStackToolboxContainer({
  showBadFormState,
  setShowBadFormState,
  setDefineLiquidModal,
  selectedLabwareIds,
  setShowLiquidLayoutOverlay,
  setSelectedLabware,
}: LiquidToolboxContainerProps): JSX.Element {
  // All selectors moved here
  const labwareEntities = useSelector(getLabwareEntities)
  const labwareId = useSelector(labwareIngredSelectors.getSelectedLabwareId)
  const labwareIds =
    useSelector(labwareIngredSelectors.getSelectedLabwareIds) ?? []
  const { labware } = useSelector(getInitialDeckSetup)
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
      setSelectedLabware={setSelectedLabware}
      data={data}
    />
  )
}
