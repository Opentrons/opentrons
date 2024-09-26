import { useState } from 'react'

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import reduce from 'lodash/reduce'
import isEmpty from 'lodash/isEmpty'
import last from 'lodash/last'
import filter from 'lodash/filter'
import mapValues from 'lodash/mapValues'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import * as Yup from 'yup'

import { LegacyModal, OutlineButton } from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  OT2_ROBOT_TYPE,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'
import {
  actions as stepFormActions,
  selectors as stepFormSelectors,
  getIsCrashablePipetteSelected,
} from '../../../step-forms'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import { getRobotType } from '../../../file-data/selectors'
import { uuid } from '../../../utils'
import { getLabwareEntities } from '../../../step-forms/selectors'
import {
  createContainer,
  deleteContainer,
} from '../../../labware-ingred/actions'
import { actions as steplistActions } from '../../../steplist'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { CrashInfoBox } from '../../modules'
import { getCrashableModuleSelected } from '../CreateFileWizard/utils'
import { adapter96ChannelDefUri } from '../CreateFileWizard'
import { StepChangesConfirmModal } from '../EditPipettesModal/StepChangesConfirmModal'
import { PipetteFields } from './PipetteFields'

import type {
  ModuleType,
  ModuleModel,
  PipetteName,
} from '@opentrons/shared-data'
import type {
  LabwareEntities,
  NormalizedPipette,
} from '@opentrons/step-generation'
import type { NewProtocolFields } from '../../../load-file'
import type {
  PipetteOnDeck,
  FormPipettesByMount,
  FormModules,
  FormPipette,
} from '../../../step-forms'
import type { DeckSlot, ThunkDispatch } from '../../../types'
import type { StepIdType } from '../../../form-types'

import styles from './FilePipettesModal.module.css'
import modalStyles from '../modal.module.css'

export type PipetteFieldsData = Omit<
  PipetteOnDeck,
  'id' | 'spec' | 'tiprackLabwareDef'
>

export interface ModuleCreationArgs {
  type: ModuleType
  model: ModuleModel
  slot: DeckSlot
}

export interface FormState {
  fields: NewProtocolFields
  pipettesByMount: FormPipettesByMount
  modules: FormModules
}

export interface Props {
  closeModal: () => void
}

const initialFormState: FormState = {
  fields: {
    name: '',
    robotType: OT2_ROBOT_TYPE,
    description: '',
    organizationOrAuthor: '',
  },
  pipettesByMount: {
    left: { pipetteName: '', tiprackDefURI: null },
    right: { pipetteName: '', tiprackDefURI: null },
  },
  modules: {},
}

const pipetteValidationShape = Yup.object().shape({
  pipetteName: Yup.string().nullable(),
  tiprackDefURI: Yup.array()
    .of(Yup.string())
    .nullable()
    .when('pipetteName', {
      is: (val: string | null): boolean => Boolean(val),
      then: schema => schema.required('Required'),
      otherwise: schema => schema.nullable(),
    }),
})
// any typing this because TS says there are too many possibilities of what this could be
const moduleValidationShape: any = Yup.object().shape({
  type: Yup.string(),
  model: Yup.string(),
  slot: Yup.string(),
})

const validationSchema: any = Yup.object().shape({
  fields: Yup.object().shape({
    name: Yup.string(),
  }),
  pipettesByMount: Yup.object()
    .shape({
      left: pipetteValidationShape,
      right: pipetteValidationShape,
    })
    .test('pipette-is-required', 'a pipette is required', value =>
      // @ts-expect-error(sa, 2021-6-21): TS not extracting type of value properly
      Object.keys(value).some((val: string) => value[val].pipetteName)
    ),
  modulesByType: Yup.object().shape({
    [MAGNETIC_MODULE_TYPE]: moduleValidationShape,
    [TEMPERATURE_MODULE_TYPE]: moduleValidationShape,
    [THERMOCYCLER_MODULE_TYPE]: moduleValidationShape,
  }),
})

const makeUpdatePipettes = (
  labwareEntities: LabwareEntities,
  prevPipettes: { [pipetteId: string]: PipetteOnDeck },
  orderedStepIds: StepIdType[],
  dispatch: ThunkDispatch<any>,
  closeModal: () => void
) => ({ pipettes: newPipetteArray }: { pipettes: PipetteFieldsData[] }) => {
  const prevPipetteIds = Object.keys(prevPipettes)
  const usedPrevPipettes: string[] = [] // IDs of pipettes in prevPipettes that were already put into nextPipettes
  const nextPipettes: {
    [pipetteId: string]: {
      mount: string
      name: PipetteName
      tiprackDefURI: string[]
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
  const newTiprackUris = new Set(
    newPipetteArray.flatMap(pipette => pipette.tiprackDefURI)
  )
  const previousTiprackLabwares = Object.values(labwareEntities).filter(
    labware => labware.def.parameters.isTiprack
  )

  const previousTiprackUris = new Set(
    previousTiprackLabwares.map(labware => labware.labwareDefURI)
  )

  // Find tipracks to delete (old tipracks not in new pipettes)
  previousTiprackLabwares
    .filter(labware => !newTiprackUris.has(labware.labwareDefURI))
    .forEach(labware => dispatch(deleteContainer({ labwareId: labware.id })))

  // Create new tipracks that are not in previous tiprackURIs
  newTiprackUris.forEach(tiprackDefUri => {
    if (!previousTiprackUris.has(tiprackDefUri)) {
      const adapterUnderLabwareDefURI = newPipetteArray.some(
        pipette => pipette.name === 'p1000_96'
      )
        ? adapter96ChannelDefUri
        : undefined
      dispatch(
        createContainer({
          labwareDefURI: tiprackDefUri,
          adapterUnderLabwareDefURI,
        })
      )
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
      const nextTips = nextPipette.tiprackDefURI
      const oldTips =
        newPipetteId in prevPipettes
          ? prevPipettes[newPipetteId].tiprackDefURI
          : null
      const tiprackChanged =
        oldTips != null &&
        nextTips.every((item, index) => item !== oldTips[index])
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

export const FilePipettesModal = (props: Props): JSX.Element => {
  const [
    showEditPipetteConfirmation,
    setShowEditPipetteConfirmation,
  ] = useState<boolean>(false)
  const { t } = useTranslation(['modal', 'button', 'form'])
  const robotType = useSelector(getRobotType)
  const dispatch = useDispatch()
  const labwareEntities = useSelector(getLabwareEntities)
  const initialPipettes = useSelector(
    stepFormSelectors.getPipettesForEditPipetteForm
  )
  const prevPipettes = useSelector(stepFormSelectors.getInitialDeckSetup)
    .pipettes
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  const moduleRestrictionsDisabled = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )

  const onCloseModal = (): void => {
    setShowEditPipetteConfirmation(false)
    props.closeModal()
  }

  const onSave: (args: {
    newProtocolFields: NewProtocolFields
    modules: ModuleCreationArgs[]
    pipettes: PipetteFieldsData[]
  }) => void = makeUpdatePipettes(
    labwareEntities,
    prevPipettes,
    orderedStepIds,
    dispatch,
    onCloseModal
  )

  const handleFormSubmit: (values: FormState) => void = values => {
    if (!showEditPipetteConfirmation) {
      setShowEditPipetteConfirmation(true)
    }
    const newProtocolFields = values.fields
    const pipettes = reduce<FormPipettesByMount, PipetteFieldsData[]>(
      values.pipettesByMount,
      (acc, formPipette: FormPipette, mount): PipetteFieldsData[] => {
        console.assert(
          mount === 'left' || mount === 'right',
          `invalid mount: ${mount}`
        ) // this is mostly for flow
        // @ts-expect-error(sa, 2021-6-21): TODO validate that pipette names coming from the modal are actually valid pipette names on PipetteName type
        return formPipette &&
          formPipette.pipetteName != null &&
          formPipette.tiprackDefURI != null &&
          (mount === 'left' || mount === 'right')
          ? [
              ...acc,
              {
                mount,
                name: formPipette.pipetteName,
                tiprackDefURI: formPipette.tiprackDefURI,
              },
            ]
          : acc
      },
      []
    )

    const modules: ModuleCreationArgs[] =
      values.modules != null
        ? Object.entries(values.modules).reduce<ModuleCreationArgs[]>(
            (acc, [number, formModule]) => {
              return [
                ...acc,
                {
                  type: formModule.type,
                  model: formModule.model || ('' as ModuleModel),
                  slot: formModule.slot,
                },
              ]
            },
            []
          )
        : []
    const heaterShakerIndex = modules.findIndex(
      hwModule => hwModule.type === HEATERSHAKER_MODULE_TYPE
    )
    const magModIndex = modules.findIndex(
      hwModule => hwModule.type === MAGNETIC_MODULE_TYPE
    )
    if (heaterShakerIndex > -1 && magModIndex > -1) {
      // if both are present, move the Mag mod to slot 9, since both can't be in slot 1
      modules[magModIndex].slot = '9'
    }
    onSave({ newProtocolFields, modules, pipettes })
  }

  const getInitialValues: () => FormState = () => {
    return {
      ...initialFormState,
      pipettesByMount: {
        ...initialFormState.pipettesByMount,
        ...initialPipettes,
      },
      modules: {
        ...initialFormState.modules,
      },
    }
  }

  const {
    handleSubmit,
    formState,
    control,
    setValue,
    trigger,
    watch,
    getValues,
  } = useForm<FormState>({
    defaultValues: getInitialValues(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    resolver: yupResolver(validationSchema),
  })
  const pipettesByMount = watch('pipettesByMount')
  const { modules } = getValues()

  const { left, right } = pipettesByMount
  // at least one must not be none (empty string)
  const pipetteSelectionIsValid = left.pipetteName || right.pipetteName

  const hasCrashableMagnetModuleSelected = getCrashableModuleSelected(
    modules,
    MAGNETIC_MODULE_TYPE
  )
  const hasCrashableTemperatureModuleSelected = getCrashableModuleSelected(
    modules,
    TEMPERATURE_MODULE_TYPE
  )
  const hasHeaterShakerSelected =
    modules != null
      ? Object.values(modules).some(
          module => module.type === HEATERSHAKER_MODULE_TYPE
        )
      : false

  const leftPipetteSpecs =
    left.pipetteName != null && left.pipetteName !== ''
      ? getPipetteSpecsV2(left.pipetteName as PipetteName)
      : null
  const rightPipetteSpecs =
    right.pipetteName != null && right.pipetteName !== ''
      ? getPipetteSpecsV2(right.pipetteName as PipetteName)
      : null

  const showHeaterShakerPipetteCollisions =
    hasHeaterShakerSelected &&
    [leftPipetteSpecs, rightPipetteSpecs].some(
      pipetteSpecs => pipetteSpecs && pipetteSpecs.channels !== 1
    )

  const crashablePipetteSelected = getIsCrashablePipetteSelected(
    pipettesByMount
  )

  const showTempPipetteCollisons =
    crashablePipetteSelected && hasCrashableTemperatureModuleSelected
  const showMagPipetteCollisons =
    crashablePipetteSelected && hasCrashableMagnetModuleSelected

  return (
    <LegacyModal
      contentsClassName={cx(
        styles.new_file_modal_contents,
        modalStyles.scrollable_modal_wrapper
      )}
      className={cx(modalStyles.modal, styles.new_file_modal)}
    >
      <div className={modalStyles.scrollable_modal_wrapper}>
        <div className={modalStyles.scrollable_modal_scroll}>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <h2 className={styles.new_file_modal_title}>
              {t('edit_pipettes.title')}
            </h2>
            <PipetteFields
              values={pipettesByMount}
              setValue={setValue}
              formState={formState}
              trigger={trigger}
              robotType={robotType}
              control={control}
            />
            {!moduleRestrictionsDisabled && (
              <CrashInfoBox
                showDiagram
                showMagPipetteCollisons={showMagPipetteCollisons}
                showTempPipetteCollisons={showTempPipetteCollisons}
                showHeaterShakerLabwareCollisions={hasHeaterShakerSelected}
                showHeaterShakerModuleCollisions={hasHeaterShakerSelected}
                showHeaterShakerPipetteCollisions={
                  showHeaterShakerPipetteCollisions
                }
              />
            )}
            <div className={modalStyles.button_row}>
              <OutlineButton
                onClick={props.closeModal}
                tabIndex={7}
                className={styles.button}
              >
                {t('button:cancel')}
              </OutlineButton>
              <OutlineButton
                disabled={!pipetteSelectionIsValid}
                type="submit"
                tabIndex={6}
                className={styles.button}
              >
                {t('button:save')}
              </OutlineButton>
            </div>
          </form>

          {showEditPipetteConfirmation ? (
            <StepChangesConfirmModal
              onCancel={() => {
                setShowEditPipetteConfirmation(false)
              }}
              onConfirm={() => handleSubmit(handleFormSubmit)()}
            />
          ) : null}
        </div>
      </div>
    </LegacyModal>
  )
}
