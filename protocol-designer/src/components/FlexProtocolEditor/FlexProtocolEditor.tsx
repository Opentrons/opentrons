import React, { useState, useEffect } from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  Box,
  COLORS,
  BORDERS,
  SPACING,
  NewPrimaryBtn,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
  HEATERSHAKER_MODULE_TYPE,
  ModuleModel,
  SPAN7_8_10_11_SLOT,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  GRIPPER_V1,
  GRIPPER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { i18n } from '../../localization'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'
import { mountSide, navPillTabListLength, pipetteSlot } from './constant'
import { FlexRoundTab } from './FlexRoundTab'
import { DeckSlot } from '../../types'
import { FlexProtocolName, SelectPipetteOption } from './FlexPillForm'
import { FlexModules } from './FlexModules'
import { connect, useDispatch } from 'react-redux'
import { actions as navActions } from '../../navigation'
import { reduce } from 'lodash'
import { PipetteOnDeck } from '../../step-forms'
import assert from 'assert'
import { ModuleCreationArgs } from '../modals/FilePipettesModal'
import { LabwareDefByDefURI } from '../../labware-defs'
import { NewProtocolFields } from '../../load-file'
import {
  mapDispatchToProps,
  mapStateToProps as newModalFileMapStateToProps,
} from '../modals/NewFileModal'
type Props = React.ComponentProps<typeof FlexProtocolEditor>
export interface FormModule {
  onDeck: boolean
  model: ModuleModel | null
  slot: DeckSlot
}

export interface FormPipette {
  pipetteName: string | null | undefined
  mount: string | null | undefined
  tiprackDefURI: any[]
  isSelected: boolean
}
export interface FormPipettesByMount {
  left: FormPipette
  right: FormPipette
}
export interface InitialValues {
  fields: { name: string; author: string; description: string }
  mountSide: string
  pipettesByMount: FormPipettesByMount
  modulesByType: {
    magneticModuleType: FormModule
    temperatureModuleType: FormModule
    thermocyclerModuleType: FormModule
    heaterShakerModuleType: FormModule
    gripperModuleType: FormModule
  }
}

interface FlexProtocolEditorComponentProps {
  isEditValue: boolean
  tabIdValue: any
  formProps: any
  onSave: (args: {
    newProtocolFields: NewProtocolFields
    pipettes: PipetteFieldsData[]
    modules: ModuleCreationArgs[]
  }) => void
}

const validationSchema = Yup.object().shape({
  fields: Yup.object().shape({
    name: Yup.string().matches(
      /^[a-zA-Z0-9]*$/,
      'Protocol name must contain only letters and numbers.'
    ),
  }),
  mountSide: Yup.string().required('Mount side is required'),
  pipettesByMount: Yup.object().shape({
    left: Yup.object().shape({
      pipetteName: Yup.string().required('First pipette is required'),
      // tiprackDefURI: Yup.array().min(
      //   1,
      //   'Select at least one tip rack for first pipette'
      // ),
    }),
    right: Yup.object().shape({
      pipetteName: Yup.string().required('Second pipette is required'),
      // tiprackDefURI: Yup.array().min(
      //   1,
      //   'Select at least one tip rack for second pipette'
      // ),
    }),
  }),
})

const initialFormValues: InitialValues = {
  fields: {
    name: '',
    author: '',
    description: '',
  },
  mountSide,
  pipettesByMount: {
    left: {
      pipetteName: '',
      mount: 'left',
      tiprackDefURI: [],
      isSelected: false,
    },
    right: {
      pipetteName: '',
      mount: 'right',
      tiprackDefURI: [],
      isSelected: false,
    },
  },
  modulesByType: {
    [HEATERSHAKER_MODULE_TYPE]: {
      onDeck: false,
      model: HEATERSHAKER_MODULE_V1,
      slot: '1',
    },
    [MAGNETIC_MODULE_TYPE]: {
      onDeck: false,
      model: MAGNETIC_MODULE_V1,
      slot: '4',
    },
    [TEMPERATURE_MODULE_TYPE]: {
      onDeck: false,
      model: TEMPERATURE_MODULE_V2,
      slot: '3',
    },
    [THERMOCYCLER_MODULE_TYPE]: {
      onDeck: false,
      model: THERMOCYCLER_MODULE_V1, // Default to GEN1 for TC only
      slot: SPAN7_8_10_11_SLOT,
    },
    [GRIPPER_MODULE_TYPE]: {
      onDeck: false,
      model: GRIPPER_V1,
      slot: '',
    },
  },
}

const getInitialValues = (formProps: any): InitialValues => {
  if (formProps) {
    if (formProps.formValues) {
      const { protocolName, author, description } = formProps.formValues
      initialFormValues.fields.name = protocolName || ''
      initialFormValues.fields.author = author || ''
      initialFormValues.fields.description = description || ''
    }

    if (Boolean(formProps.instruments)) {
      const { left, right } = formProps.instruments
      if (Boolean(left)) {
        initialFormValues.pipettesByMount.left.pipetteName =
          left.pipetteSpecs?.name || ''
        initialFormValues.pipettesByMount.left.tiprackDefURI =
          left?.tiprackModel || []
      }
      if (Boolean(right)) {
        initialFormValues.pipettesByMount.right.pipetteName =
          right.pipetteSpecs?.name || ''
        initialFormValues.pipettesByMount.right.tiprackDefURI =
          right?.tiprackModel || []
      }
    }

    if (Boolean(formProps.modules)) {
      if (formProps.modules.magneticModuleType !== null) {
        initialFormValues.modulesByType[MAGNETIC_MODULE_TYPE] =
          formProps.modules.magneticModuleType
      }
      if (formProps.modules.temperatureModuleType !== null) {
        initialFormValues.modulesByType[TEMPERATURE_MODULE_TYPE] =
          formProps.modules.temperatureModuleType
      }
      if (formProps.modules.thermocyclerModuleType !== null) {
        initialFormValues.modulesByType[THERMOCYCLER_MODULE_TYPE] =
          formProps.modules.thermocyclerModuleType
      }
      if (formProps.modules.heaterShakerModuleType !== null) {
        initialFormValues.modulesByType[HEATERSHAKER_MODULE_TYPE] =
          formProps.modules.heaterShakerModuleType
      }

      console.log(initialFormValues.modulesByType)
    }

    return initialFormValues
  } else {
    return initialFormValues
  }
}

interface selectedTabProps {
  selectedTab: number
}

const selectComponent = (selectedTab: number): JSX.Element | null => {
  const { left, right } = pipetteSlot
  switch (selectedTab) {
    case 0:
      return <FlexProtocolName />
    case 1:
      return (
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <SelectPipetteOption pipetteName={left} />
          <SelectPipetteOption pipetteName={right} />
        </Flex>
      )
    case 2:
      return <FlexModules />
    default:
      return null
  }
}

type PipetteFieldsData = Omit<
  PipetteOnDeck,
  'id' | 'spec' | 'tiprackLabwareDef'
>

function FlexProtocolEditor({
  isEditValue,
  tabIdValue,
  formProps,
  onSave,
}: FlexProtocolEditorComponentProps): JSX.Element {
  const [selectedTab, setTab] = useState<number>(0)
  const dispatch = useDispatch()
  const [isEdit, setEdit] = useState<boolean>(false)
  //On Redirction if page tab edit set to true
  useEffect(() => {
    if (isEditValue) {
      setEdit(isEditValue)
      setTab(tabIdValue)
    }
  }, [isEditValue, tabIdValue])

  // Next button click
  const handleNext = ({ selectedTab }: selectedTabProps): void => {
    if (isEdit) {
      //Redirect back to file details page
    } else {
      const setTabNumber =
        selectedTab >= 0 && selectedTab <= navPillTabListLength
          ? selectedTab + 1
          : selectedTab
      setTab(setTabNumber)
    }
  }

  // Previous button click
  const handlePrevious = ({ selectedTab }: selectedTabProps): void => {
    const setTabNumber =
      selectedTab > 0 && selectedTab <= navPillTabListLength
        ? selectedTab - 1
        : selectedTab
    setTab(setTabNumber)
  }

  const nextButton =
    selectedTab === navPillTabListLength
      ? i18n.t('flex.round_tabs.go_to_liquids_page')
      : isEdit
      ? i18n.t('flex.round_tabs.update')
      : i18n.t('flex.round_tabs.next')

  interface FormikErrors {
    pipette?: string
    tiprack?: string
  }

  const validateFields = (values: InitialValues): FormikErrors => {
    const { pipettesByMount } = values
    const errors: FormikErrors = {}
    if (!pipettesByMount.left.pipetteName) {
      errors.pipette = `${i18n.t('flex.errors.first_pipette_not_selected')}`
    }

    if (!pipettesByMount.left.tiprackDefURI.length) {
      errors.tiprack = `${i18n.t('flex.errors.tiprack_not_selected')}`
    }

    return errors
  }

  const handleSubmit = ({ values }: any): void => {
    console.log('***Final OT3 JSON Data ***', values)
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

    onSave({ modules, newProtocolFields, pipettes })
    dispatch(navActions.navigateToPage('liquids'))
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex>
        <FlexRoundTab setCurrentTab={setTab} currentTab={selectedTab} />
      </Flex>
      <Box
        backgroundColor={COLORS.white}
        border={BORDERS.lineBorder}
        // remove left upper corner border radius when first tab is active
        borderRadius={selectedTab === 1 ? '0' : BORDERS.radiusSoftCorners}
        padding={SPACING.spacing4}
      >
        {
          <Formik
            enableReinitialize
            initialValues={getInitialValues(formProps)}
            validateOnChange={true}
            validate={validateFields}
            validationSchema={validationSchema}
            onSubmit={(values, actions) => {
              selectedTab === 3 && handleSubmit({ values })
            }}
          >
            {(props: {
              errors: any
              isValid: any
              handleSubmit: () => void
            }) => (
              <form onSubmit={props.handleSubmit}>
                <section className={styles.editor_form}>
                  {selectComponent(selectedTab)}
                </section>
                <div className={styles.flex_round_tabs_button_wrapper}>
                  {selectedTab !== 0 && !isEdit && (
                    <NewPrimaryBtn
                      tabIndex={5}
                      onClick={() => handlePrevious({ selectedTab })}
                      className={styles.flex_round_tabs_button_50p}
                    >
                      <StyledText as="h3">
                        {i18n.t('flex.round_tabs.previous')}
                      </StyledText>
                    </NewPrimaryBtn>
                  )}
                  <NewPrimaryBtn
                    tabIndex={4}
                    type="submit"
                    onClick={() => handleNext({ selectedTab })}
                    className={
                      selectedTab !== 0
                        ? styles.flex_round_tabs_button_50p
                        : styles.flex_round_tabs_button_100p
                    }
                  >
                    <StyledText as="h3">{nextButton}</StyledText>
                  </NewPrimaryBtn>
                </div>
              </form>
            )}
          </Formik>
        }
      </Box>
    </Flex>
  )
}

interface CreateNewProtocolArgs {
  customLabware: LabwareDefByDefURI
  newProtocolFields: NewProtocolFields
  pipettes: PipetteFieldsData[]
  modules: ModuleCreationArgs[]
}
interface DP {
  onCancel: () => unknown
  _createNewProtocol: (arg0: CreateNewProtocolArgs) => void
}
function mergeProps(stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  return {
    onSave: fields => {
      if (
        !stateProps._hasUnsavedChanges ||
        window.confirm(i18n.t('alert.window.confirm_create_new'))
      ) {
        dispatchProps._createNewProtocol({
          ...fields,
          customLabware: stateProps._customLabware,
        })
      }
    },
  }
}

export const FlexProtocolEditorComponent = connect(
  newModalFileMapStateToProps,
  mapDispatchToProps,
  mergeProps
)(FlexProtocolEditor)
