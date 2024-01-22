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
import * as wellContentsSelectors from '../../../../top-selectors/well-contents'
import { selectors } from '../../../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { WellSelectionInstructions } from '../../../WellSelectionInstructions'
import { SelectableLabware, wellFillFromWellContents } from '../../../labware'

import type { ContentsByWell } from '../../../../labware-ingred/types'
import type { WellIngredientNames } from '../../../../steplist/types'
import type { StepFieldName } from '../../../../form-types'
import type { NozzleType } from '../../../../types'

import styles from './WellSelectionModal.css'
import modalStyles from '../../../modals/modal.css'

interface WellSelectionModalProps {
  isOpen: boolean
  name: StepFieldName
  onCloseClick: (e?: React.MouseEvent<HTMLDivElement>) => unknown
  value: unknown
  updateValue: (val: unknown | null | undefined) => void
  nozzleType?: NozzleType | null
  labwareId?: string | null
  pipetteId?: string | null
}

interface WellSelectionModalComponentProps {
  deselectWells: (wellGroup: WellGroup) => unknown
  nozzleType: NozzleType | null
  handleSave: () => unknown
  highlightedWells: WellGroup
  ingredNames: WellIngredientNames
  onCloseClick: (e?: React.MouseEvent<any>) => unknown
  selectedPrimaryWells: WellGroup
  selectWells: (wellGroup: WellGroup) => unknown
  updateHighlightedWells: (wellGroup: WellGroup) => unknown
  wellContents: ContentsByWell
  labwareDef?: LabwareDefinition2 | null
  pipetteSpec?: PipetteNameSpecs | null
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
    nozzleType,
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
          nozzleType={nozzleType}
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
  const {
    isOpen,
    labwareId,
    onCloseClick,
    pipetteId,
    nozzleType = null,
    updateValue,
  } = props
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
    updateValue(sortedWells)
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
        nozzleType,
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
