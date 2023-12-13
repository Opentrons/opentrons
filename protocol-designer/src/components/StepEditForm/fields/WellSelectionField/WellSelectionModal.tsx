import * as React from 'react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import omit from 'lodash/omit'

import {
  Modal,
  OutlineButton,
  LabeledValue,
  WellGroup,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import {
  sortWells,
  LabwareDefinition2,
  PipetteNameSpecs,
} from '@opentrons/shared-data'

import { arrayToWellGroup } from '../../../../utils'
import { WellSelectionInstructions } from '../../../WellSelectionInstructions'
import { SelectableLabware, wellFillFromWellContents } from '../../../labware'

import * as wellContentsSelectors from '../../../../top-selectors/well-contents'
import { selectors } from '../../../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { ContentsByWell } from '../../../../labware-ingred/types'
import { WellIngredientNames } from '../../../../steplist/types'
import { StepFieldName } from '../../../../form-types'

import styles from './WellSelectionModal.module.css'
import modalStyles from '../../../modals/modal.module.css'

interface WellSelectionModalProps {
  isOpen: boolean
  labwareId?: string | null
  name: StepFieldName
  onCloseClick: (e?: React.MouseEvent<HTMLDivElement>) => unknown
  pipetteId?: string | null
  value: unknown
  updateValue: (val: unknown | null | undefined) => void
}

interface WellSelectionModalComponentProps {
  deselectWells: (wellGroup: WellGroup) => unknown
  handleSave: () => unknown
  highlightedWells: WellGroup
  ingredNames: WellIngredientNames
  labwareDef?: LabwareDefinition2 | null
  onCloseClick: (e?: React.MouseEvent<any>) => unknown
  pipetteSpec?: PipetteNameSpecs | null
  selectedPrimaryWells: WellGroup
  selectWells: (wellGroup: WellGroup) => unknown
  updateHighlightedWells: (wellGroup: WellGroup) => unknown
  wellContents: ContentsByWell
}

const WellSelectionModalComponent = (
  props: WellSelectionModalComponentProps
): JSX.Element => {
  const {
    deselectWells,
    handleSave,
    highlightedWells,
    ingredNames,
    labwareDef,
    onCloseClick,
    pipetteSpec,
    selectedPrimaryWells,
    selectWells,
    wellContents,
    updateHighlightedWells,
  } = props
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)

  return (
    <Modal
      className={modalStyles.modal}
      contentsClassName={cx(
        modalStyles.modal_contents,
        modalStyles.transparent_content
      )}
      onCloseClick={onCloseClick}
    >
      <div className={styles.top_row}>
        <LabeledValue
          label="Pipette"
          value={pipetteSpec ? pipetteSpec.displayName : ''}
          className={styles.inverted_text}
        />
        <OutlineButton onClick={handleSave} inverted>
          SAVE SELECTION
        </OutlineButton>
      </div>

      {labwareDef && (
        <SelectableLabware
          labwareProps={{
            wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE,
            definition: labwareDef,
            highlightedWells,
            wellFill: wellFillFromWellContents(
              wellContents,
              liquidDisplayColors
            ),
          }}
          selectedPrimaryWells={selectedPrimaryWells}
          selectWells={selectWells}
          deselectWells={deselectWells}
          updateHighlightedWells={updateHighlightedWells}
          pipetteChannels={pipetteSpec ? pipetteSpec.channels : null}
          ingredNames={ingredNames}
          wellContents={wellContents}
        />
      )}

      <WellSelectionInstructions />
    </Modal>
  )
}

export const WellSelectionModal = (
  props: WellSelectionModalProps
): JSX.Element | null => {
  const { isOpen, labwareId, onCloseClick, pipetteId } = props
  const wellFieldData = props.value

  // selector data
  const allWellContentsForStep = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )

  const ingredNames = useSelector(selectors.getLiquidNamesById)
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const pipetteEntities = useSelector(stepFormSelectors.getPipetteEntities)

  // selector-derived data
  const labwareDef = (labwareId && labwareEntities[labwareId]?.def) || null
  const pipette = pipetteId != null ? pipetteEntities[pipetteId] : null

  const initialSelectedPrimaryWells = Array.isArray(wellFieldData)
    ? arrayToWellGroup(wellFieldData)
    : {}

  // component state
  const [
    selectedPrimaryWells,
    setSelectedPrimaryWells,
  ] = React.useState<WellGroup>(initialSelectedPrimaryWells)
  const [highlightedWells, setHighlightedWells] = React.useState<WellGroup>({})

  // actions
  const selectWells = (wells: WellGroup): void => {
    setSelectedPrimaryWells(prev => ({ ...prev, ...wells }))
    setHighlightedWells({})
  }

  const deselectWells = (deselectedWells: WellGroup): void => {
    setSelectedPrimaryWells(prev => omit(prev, Object.keys(deselectedWells)))
    setHighlightedWells({})
  }

  const handleSave = (): void => {
    const sortedWells = Object.keys(selectedPrimaryWells).sort(sortWells)
    props.updateValue(sortedWells)
    onCloseClick()
  }

  if (!isOpen) return null

  return (
    <WellSelectionModalComponent
      {...{
        deselectWells,
        handleSave,
        highlightedWells,
        ingredNames,
        labwareDef,
        onCloseClick,
        pipetteSpec: pipette?.spec,
        selectWells,
        selectedPrimaryWells,
        updateHighlightedWells: setHighlightedWells,
        wellContents:
          labwareId != null && allWellContentsForStep != null
            ? allWellContentsForStep[labwareId]
            : {},
      }}
    />
  )
}
