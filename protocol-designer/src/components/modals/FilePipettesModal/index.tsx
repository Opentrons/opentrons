import * as React from 'react'
import assert from 'assert'
import reduce from 'lodash/reduce'
import isEmpty from 'lodash/isEmpty'
import last from 'lodash/last'
import filter from 'lodash/filter'
import mapValues from 'lodash/mapValues'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import * as Yup from 'yup'

import { Modal, OutlineButton } from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
  HEATERSHAKER_MODULE_TYPE,
  ModuleType,
  ModuleModel,
  getPipetteNameSpecs,
  PipetteName,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_BLOCK_TYPE,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import {
  actions as stepFormActions,
  selectors as stepFormSelectors,
  getIsCrashablePipetteSelected,
  PipetteOnDeck,
  FormPipettesByMount,
  FormModulesByType,
  FormPipette,
} from '../../../step-forms'
import {
  INITIAL_DECK_SETUP_STEP_ID,
  SPAN7_8_10_11_SLOT,
} from '../../../constants'
import { NewProtocolFields } from '../../../load-file'
import { getRobotType } from '../../../file-data/selectors'
import { uuid } from '../../../utils'
import { actions as steplistActions } from '../../../steplist'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { CrashInfoBox, isModuleWithCollisionIssue } from '../../modules'
import { StepChangesConfirmModal } from '../EditPipettesModal/StepChangesConfirmModal'
import { PipetteFields } from './PipetteFields'

import styles from './FilePipettesModal.css'
import modalStyles from '../modal.css'

import type { DeckSlot, ThunkDispatch } from '../../../types'
import type { NormalizedPipette } from '@opentrons/step-generation'
import type { StepIdType } from '../../../form-types'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

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
  modulesByType: FormModulesByType
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
  modulesByType: {
    [MAGNETIC_BLOCK_TYPE]: {
      onDeck: false,
      model: MAGNETIC_BLOCK_V1,
      slot: '1',
    },
    [HEATERSHAKER_MODULE_TYPE]: {
      onDeck: false,
      model: HEATERSHAKER_MODULE_V1,
      slot: '1',
    },
    [MAGNETIC_MODULE_TYPE]: {
      onDeck: false,
      model: null,
      slot: '1',
    },
    [TEMPERATURE_MODULE_TYPE]: {
      onDeck: false,
      model: null,
      slot: '3',
    },
    [THERMOCYCLER_MODULE_TYPE]: {
      onDeck: false,
      model: THERMOCYCLER_MODULE_V1, // Default to GEN1 for TC only
      slot: SPAN7_8_10_11_SLOT,
    },
  },
}

const pipetteValidationShape = Yup.object().shape({
  pipetteName: Yup.string().nullable(),
  tiprackDefURI: Yup.string()
    .nullable()
    .when('pipetteName', {
      is: (val: string | null): boolean => Boolean(val),
      then: schema => schema.required('Required'),
      otherwise: schema => schema.nullable(),
    }),
})
// any typing this because TS says there are too many possibilities of what this could be
const moduleValidationShape: any = Yup.object().shape({
  onDeck: Yup.boolean().default(false),
  model: Yup.string()
    .nullable()
    .when('onDeck', {
      is: true,
      then: schema => schema.required('Required'),
      otherwise: schema => schema.nullable(),
    }),
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

export const FilePipettesModal = (props: Props): JSX.Element => {
  const [
    showEditPipetteConfirmation,
    setShowEditPipetteConfirmation,
  ] = React.useState<boolean>(false)
  const { t } = useTranslation(['modal', 'button', 'form'])
  const robotType = useSelector(getRobotType)
  const dispatch = useDispatch()
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
    pipettes: PipetteFieldsData[]
    modules: ModuleCreationArgs[]
  }) => void = makeUpdatePipettes(
    prevPipettes,
    orderedStepIds,
    dispatch,
    onCloseModal
  )

  const getCrashableModuleSelected: (
    modules: FormModulesByType,
    moduleType: ModuleType
  ) => boolean = (modules, moduleType) => {
    const formModule = modules[moduleType]
    const crashableModuleOnDeck =
      formModule?.onDeck && formModule?.model
        ? isModuleWithCollisionIssue(formModule.model)
        : false

    return crashableModuleOnDeck
  }

  const handleFormSubmit: (values: FormState) => void = values => {
    if (!showEditPipetteConfirmation) {
      setShowEditPipetteConfirmation(true)
    }
    const newProtocolFields = values.fields
    const pipettes = reduce<FormPipettesByMount, PipetteFieldsData[]>(
      values.pipettesByMount,
      (acc, formPipette: FormPipette, mount): PipetteFieldsData[] => {
        assert(mount === 'left' || mount === 'right', `invalid mount: ${mount}`) // this is mostly for flow
        // @ts-expect-error(sa, 2021-6-21): TODO validate that pipette names coming from the modal are actually valid pipette names on PipetteName type
        return formPipette &&
          formPipette.pipetteName &&
          formPipette.tiprackDefURI &&
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

    // NOTE: this is extra-explicit for flow. Reduce fns won't cooperate
    // with enum-typed key like `{[ModuleType]: ___}`
    // @ts-expect-error(sa, 2021-6-21): TS not smart enough to take real type from Object.keys
    const moduleTypes: ModuleType[] = Object.keys(values.modulesByType)
    const modules: ModuleCreationArgs[] = moduleTypes.reduce<
      ModuleCreationArgs[]
    >((acc, moduleType) => {
      const formModule = values.modulesByType[moduleType]
      return formModule?.onDeck
        ? [
            ...acc,
            {
              type: moduleType,
              model: formModule.model || ('' as ModuleModel), // TODO: we need to validate that module models are of type ModuleModel
              slot: formModule.slot,
            },
          ]
        : acc
    }, [])
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
      modulesByType: {
        ...initialFormState.modulesByType,
      },
    }
  }

  const {
    handleSubmit,
    formState: { errors, isDirty, touchedFields },
    control,
    watch,
    setValue,
    trigger,
  } = useForm<FormState>({
    defaultValues: getInitialValues(),
    resolver: yupResolver(validationSchema),
  })
  const modulesByType = watch('modulesByType')
  const pipettesByMount = watch('pipettesByMount')

  const { left, right } = pipettesByMount

  const pipetteSelectionIsValid =
    // at least one must not be none (empty string)
    left.pipetteName || right.pipetteName

  const hasCrashableMagnetModuleSelected = getCrashableModuleSelected(
    modulesByType,
    MAGNETIC_MODULE_TYPE
  )
  const hasCrashableTemperatureModuleSelected = getCrashableModuleSelected(
    modulesByType,
    TEMPERATURE_MODULE_TYPE
  )
  const hasHeaterShakerSelected = Boolean(
    modulesByType[HEATERSHAKER_MODULE_TYPE].onDeck
  )

  const showHeaterShakerPipetteCollisions =
    hasHeaterShakerSelected &&
    [
      getPipetteNameSpecs(left.pipetteName as PipetteName),
      getPipetteNameSpecs(right.pipetteName as PipetteName),
    ].some(pipetteSpecs => pipetteSpecs && pipetteSpecs.channels !== 1)

  const crashablePipetteSelected = getIsCrashablePipetteSelected(
    pipettesByMount
  )

  const showTempPipetteCollisons =
    crashablePipetteSelected && hasCrashableTemperatureModuleSelected
  const showMagPipetteCollisons =
    crashablePipetteSelected && hasCrashableMagnetModuleSelected

  return (
    <Modal
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
            <Controller
              control={control}
              name="pipettesByMount"
              render={({ field }) => (
                <PipetteFields
                  initialTabIndex={1}
                  values={pipettesByMount}
                  onFieldChange={field.onChange}
                  onSetFieldValue={(name, value) =>
                    setValue(name as any, value)
                  }
                  onBlur={field.onBlur}
                  // @ts-expect-error(sa, 2021-7-2): we need to explicitly check that the module tiprackDefURI inside of pipettesByMount exists, because it could be undefined
                  errors={errors.pipettesByMount ?? null}
                  // @ts-expect-error(sa, 2021-7-2): we need to explicitly check that the module tiprackDefURI inside of pipettesByMount exists, because it could be undefined
                  touched={touchedFields.pipettesByMount ?? null}
                  onSetFieldTouched={name => trigger(name as any)}
                  robotType={robotType}
                />
              )}
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
                onClick={handleSubmit(handleFormSubmit)}
                tabIndex={6}
                className={styles.button}
              >
                {t('button:save')}
              </OutlineButton>
            </div>
          </form>

          {showEditPipetteConfirmation ? (
            <StepChangesConfirmModal
              onCancel={() => setShowEditPipetteConfirmation(false)}
              onConfirm={handleSubmit(handleFormSubmit)}
            />
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
