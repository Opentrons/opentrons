import * as React from 'react'
import { connect } from 'react-redux'
import isEmpty from 'lodash/isEmpty'
import last from 'lodash/last'
import filter from 'lodash/filter'
import mapValues from 'lodash/mapValues'
import { PipetteName, RobotType } from '@opentrons/shared-data'
import { uuid } from '../../../utils'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import { actions as steplistActions } from '../../../steplist'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import {
  actions as stepFormActions,
  selectors as stepFormSelectors,
  PipetteOnDeck,
  FormPipettesByMount,
} from '../../../step-forms'
import { FilePipettesModal, PipetteFieldsData } from '../FilePipettesModal'
import { NormalizedPipette } from '@opentrons/step-generation'
import { BaseState, ThunkDispatch } from '../../../types'
import { StepIdType } from '../../../form-types'
import { getRobotType } from '../../../file-data/selectors'

type Props = React.ComponentProps<typeof FilePipettesModal>

interface SP {
  initialPipetteValues: FormPipettesByMount
  _prevPipettes: { [pipetteId: string]: PipetteOnDeck }
  _orderedStepIds: StepIdType[]
  moduleRestrictionsDisabled?: boolean | null
  robotType: RobotType
}

interface OP {
  closeModal: () => unknown
}

const mapSTP = (state: BaseState): SP => {
  const initialPipettes = stepFormSelectors.getPipettesForEditPipetteForm(state)

  return {
    robotType: getRobotType(state),
    initialPipetteValues: initialPipettes,
    _prevPipettes: stepFormSelectors.getInitialDeckSetup(state).pipettes, // TODO: Ian 2019-01-02 when multi-step editing is supported, don't use initial deck state. Instead, show the pipettes available for the selected step range
    _orderedStepIds: stepFormSelectors.getOrderedStepIds(state),
    moduleRestrictionsDisabled: featureFlagSelectors.getDisableModuleRestrictions(
      state
    ),
  }
}

// NOTE: this function is doing some weird stuff because we are envisioning
// that the following changes will happen, and working to support them cleanly.
// We anticipate that:
// * pipettes will be created/deleted outside of the timeline (like liquids)
// * there will be multiple manualIntervention steps which set/unset pipettes
// on robot mounts on the timeline
// * there will be a facility to substitute pipettes used in steps across a
// selection of multiple steps
//
// Currently, PD's Edit Pipettes functionality is doing several of these steps
// in one click (create, change manualIntervention step, substitute pipettes
// across all steps, delete pipettes), which is why it's so funky!
const makeUpdatePipettes = (
  prevPipettes: SP['_prevPipettes'],
  orderedStepIds: SP['_orderedStepIds'],
  dispatch: ThunkDispatch<any>,
  closeModal: OP['closeModal']
) => ({ pipettes: newPipetteArray }: { pipettes: PipetteFieldsData[] }) => {
  const prevPipetteIds = Object.keys(prevPipettes)
  const usedPrevPipettes: string[] = [] // IDs of pipettes in prevPipettes that were already put into nextPipettes
  const nextPipettes: {
    [pipetteId: string]: {
      mount: string
      name: PipetteName
      tiprackDefURI: string
      id: string
    }
  } = {}

  // from array of pipettes from Edit Pipette form (with no IDs),
  // assign IDs and populate nextPipettes
  newPipetteArray.forEach((newPipette: PipetteFieldsData) => {
    if (newPipette && newPipette.name && newPipette.tiprackDefURI) {
      const candidatePipetteIds = prevPipetteIds.filter(id => {
        const prevPipette = prevPipettes[id]
        const alreadyUsed = usedPrevPipettes.some(usedId => usedId === id)
        return !alreadyUsed && prevPipette.name === newPipette.name
      })
      const pipetteId: string | null | undefined = candidatePipetteIds[0]
      if (pipetteId) {
        // update used pipette list
        usedPrevPipettes.push(pipetteId)
        nextPipettes[pipetteId] = { ...newPipette, id: pipetteId }
      } else {
        const newId = uuid()
        nextPipettes[newId] = { ...newPipette, id: newId }
      }
    }
  })

  dispatch(
    stepFormActions.createPipettes(
      mapValues(
        nextPipettes,
        (
          p: typeof nextPipettes[keyof typeof nextPipettes]
        ): NormalizedPipette => ({
          id: p.id,
          name: p.name,
          tiprackDefURI: p.tiprackDefURI,
        })
      )
    )
  )

  // set/update pipette locations in initial deck setup step
  dispatch(
    steplistActions.changeSavedStepForm({
      stepId: INITIAL_DECK_SETUP_STEP_ID,
      update: {
        pipetteLocationUpdate: mapValues(
          nextPipettes,
          (p: PipetteOnDeck) => p.mount
        ),
      },
    })
  )

  const pipetteIdsToDelete: string[] = Object.keys(prevPipettes).filter(
    id => !(id in nextPipettes)
  )

  // SubstitutionMap represents a map of oldPipetteId => newPipetteId
  // When a pipette's tiprack changes, the ids will be the same
  interface SubstitutionMap {
    [pipetteId: string]: string
  }

  const pipetteReplacementMap: SubstitutionMap = pipetteIdsToDelete.reduce(
    (acc: SubstitutionMap, deletedId: string): SubstitutionMap => {
      const deletedPipette = prevPipettes[deletedId]
      const replacementId = Object.keys(nextPipettes).find(
        newId => nextPipettes[newId].mount === deletedPipette.mount
      )
      // @ts-expect-error(sa, 2021-6-21): redlacementId will always be a string, so right side of the and will always be true
      return replacementId && replacementId !== -1
        ? { ...acc, [deletedId]: replacementId }
        : acc
    },
    {}
  )

  const pipettesWithNewTipracks: string[] = filter(
    nextPipettes,
    (nextPipette: typeof nextPipettes[keyof typeof nextPipettes]) => {
      const newPipetteId = nextPipette.id
      const tiprackChanged =
        newPipetteId in prevPipettes &&
        nextPipette.tiprackDefURI !== prevPipettes[newPipetteId].tiprackDefURI
      return tiprackChanged
    }
  ).map(pipette => pipette.id)

  // this creates an identity map with all pipette ids that have new tipracks
  // this will be used so that handleFormChange gets called even though the
  // pipette id itself has not changed (only it's tiprack)

  const pipettesWithNewTiprackIdentityMap: SubstitutionMap = pipettesWithNewTipracks.reduce(
    (acc: SubstitutionMap, id: string): SubstitutionMap => {
      return {
        ...acc,
        ...{ [id]: id },
      }
    },
    {}
  )

  const substitutionMap = {
    ...pipetteReplacementMap,
    ...pipettesWithNewTiprackIdentityMap,
  }

  // substitute deleted pipettes with new pipettes on the same mount, if any
  if (!isEmpty(substitutionMap) && orderedStepIds.length > 0) {
    // NOTE: using start/end here is meant to future-proof this action for multi-step editing
    dispatch(
      stepFormActions.substituteStepFormPipettes({
        substitutionMap,
        startStepId: orderedStepIds[0],
        // @ts-expect-error(sa, 2021-6-22): last might return undefined
        endStepId: last(orderedStepIds),
      })
    )
  }

  // delete any pipettes no longer in use
  if (pipetteIdsToDelete.length > 0) {
    dispatch(stepFormActions.deletePipettes(pipetteIdsToDelete))
  }

  closeModal()
}

const mergeProps = (
  stateProps: SP,
  dispatchProps: { dispatch: ThunkDispatch<any> },
  ownProps: OP
): Props => {
  const { _prevPipettes, _orderedStepIds, ...passThruStateProps } = stateProps
  const { dispatch } = dispatchProps
  const { closeModal } = ownProps

  const updatePipettes = makeUpdatePipettes(
    _prevPipettes,
    _orderedStepIds,
    dispatch,
    closeModal
  )

  return {
    ...passThruStateProps,
    showProtocolFields: false,
    onSave: updatePipettes,
    onCancel: closeModal,
  }
}

export const EditPipettesModal = connect(
  mapSTP,
  // @ts-expect-error(sa, 2021-6-22): TODO: refactor to use hooks api
  null,
  mergeProps
)(FilePipettesModal)
