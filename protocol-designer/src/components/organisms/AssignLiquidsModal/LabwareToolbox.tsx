import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  DIRECTION_COLUMN,
  Flex,
  InfoScreen,
  StyledText,
  Toolbox,
} from '@opentrons/components'

import { selectors as labwareIngredSelectors } from '/protocol-designer/labware-ingred/selectors'
import {
  getInitialDeckSetup,
  getLabwareEntities,
} from '/protocol-designer/step-forms/selectors'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'
import { deselectAllWells } from '/protocol-designer/well-selection/actions'

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
  data: LabwareStackToolboxData
  selectedLabwareIds: string[]
}
export function LabwareStackToolbox({
  showBadFormState,
  setShowBadFormState,
  setDefineLiquidModal,
  data,
}: LabwareStackToolboxProps): JSX.Element {
  const { t } = useTranslation(['liquids', 'form', 'shared'])
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { labware, labwareId, allWellContents } = data

  console.log('labwareId', labwareId)
  console.log('labware', labware)
  console.log('allWellContents', allWellContents)
  const handleCancelForm = (): void => {
    dispatch(deselectAllWells())
    setShowBadFormState(false)
    reset()
  }

  const labwareStack = labwareId != null ? labware[labwareId]?.stack ?? [] : []

  const handleSaveSubmit: (values: ToolboxFormValues) => void = values => {
    handleSaveForm(values)
    reset()
  }

  const handleConfirmClick = (): void => {
    navigate('/designer')
  }

  const [selectedLabwareArray, setSelectedLabware] = useState<string[]>([
    labwareId ?? '',
  ])

  useEffect(() => {
    setSelectedLabware([labwareId ?? ''])
  }, [labwareId])

  const handleSelectAllLabware = (): void => {
    setSelectedLabware(labwareStack)
  }

  const handleAssignToLabware = (newItem: string): void => {
    if (labwareId && allWellContents[newItem] !== allWellContents[labwareId]) {
      console.error(
        'You cannot assign to the labware with the different liquid'
      )
    }
    setSelectedLabware(prevItems => [...prevItems, newItem])
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
        confirmButtonText="Add another labware"
        onConfirmClick={handleConfirmClick}
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
              selectedLabware={selectedLabwareArray}
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
  selectedLabwareIds: string[]
}

export function LabwareStackToolboxContainer({
  showBadFormState,
  setShowBadFormState,
  setDefineLiquidModal,
  selectedLabwareIds,
}: LiquidToolboxContainerProps): JSX.Element {
  // All selectors moved here
  const labwareEntities = useSelector(getLabwareEntities)
  const labwareId = useSelector(labwareIngredSelectors.getSelectedLabwareId)
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
      showBadFormState={showBadFormState}
      setShowBadFormState={setShowBadFormState}
      setDefineLiquidModal={setDefineLiquidModal}
      selectedLabwareIds={selectedLabwareIds}
      data={data}
    />
  )
}
