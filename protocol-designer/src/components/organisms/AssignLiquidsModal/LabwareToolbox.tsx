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
import { LabwareEntities, LiquidEntities } from '@opentrons/step-generation'

import { LINK_BUTTON_STYLE } from '/protocol-designer/components/atoms'
import * as labwareIngredActions from '/protocol-designer/labware-ingred/actions'
import {
  removeWellsContents,
  setWellContents,
} from '/protocol-designer/labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '/protocol-designer/labware-ingred/selectors'
import { getLiquidClassDisplayName } from '/protocol-designer/liquid-defs/utils'
import { getInitialDeckSetup, getLabwareEntities, getLiquidEntities } from '/protocol-designer/step-forms/selectors'
import * as fieldProcessors from '/protocol-designer/steplist/fieldLevel/processing'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'
import { deselectAllWells } from '/protocol-designer/well-selection/actions'
import { getSelectedWells } from '/protocol-designer/well-selection/selectors'

import { LiquidCard } from './LiquidCard'

import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import type { DropdownOption } from '@opentrons/components'
import type { ContentsByWell } from '/protocol-designer/labware-ingred/types'
import { LabwareButtonBasket } from '../../molecules'

export interface LiquidInfo {
  name: string
  color: string
  liquidIndex: string
  liquidClassDisplayName: string | null
}

interface ValidFormValues {
  selectedLabwareId: string
  volume: string
}

interface ToolboxFormValues {
  selectedLiquidId?: string | null
  volume?: string | null
}

interface LabwareStackToolboxData {
  labwareEntities: LabwareEntities
  labware: Record<string, any>
  labwareId: string | null
  selectedWellGroups: any
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

  const {
      labwareEntities,
  } = data

  const handleCancelForm = (): void => {
    dispatch(deselectAllWells())
    setShowBadFormState(false)
    reset()
  }

  const labwareStack = labware[labwareId].stack


  const handleSaveSubmit: (values: ToolboxFormValues) => void = values => {
    handleSaveForm(values)
    reset()
  }

  const handleConfirmClick = (): void => {
    navigate('/designer')
  }

  return (
    <>
      <Toolbox
        title={
          <StyledText desktopStyle="bodyLargeSemiBold">
            'Stacker Labware'
          </StyledText>
        }
        onCloseClick={() => {}}
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
  const selectedWellGroups = useSelector(getSelectedWells)
  const nickNames = useSelector(getLabwareNicknamesById)
  const liquidLocations = useSelector(
    labwareIngredSelectors.getLiquidsByLabwareId
  )
  const { labware } = useSelector(getInitialDeckSetup)

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

  const data: LabwareStackToolboxData = {
    labwareEntities,
    labwareId,
    labware,
    selectedWellGroups,
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
