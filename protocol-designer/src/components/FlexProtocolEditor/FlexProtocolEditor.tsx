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
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
  HEATERSHAKER_MODULE_TYPE,
  ModuleModel,
  SPAN7_8_10_11_SLOT,
  TEMPERATURE_MODULE_V2,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  OT3_STANDARD_MODEL,
  OT3_STANDARD_DECKID,
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
import { connect, useDispatch, useSelector } from 'react-redux'
import { actions as navActions } from '../../navigation'
import { reduce } from 'lodash'
import assert from 'assert'
import {
  ModuleCreationArgs,
  PipetteFieldsData,
} from '../modals/FilePipettesModal'
import { LabwareDefByDefURI } from '../../labware-defs'
import { NewProtocolFields } from '../../load-file'
import { FlexFileDetails } from './FlexFileDetails'
import { setRobotType } from '../../load-file/actions'
import { CreateFlexFileForm } from './CreateFlexFileForm'
import {
  mapDispatchToProps,
  mapStateToProps,
} from './FlexPillForm/FlexProtocolEditorProps'
import { getLabwareDefsByURI } from '../../labware-defs/selectors'
import { getFlexTiprackOptions } from './FlexPillForm/TipRackList'
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
    magneticBlockType: FormModule
    temperatureModuleType: FormModule
    thermocyclerModuleType: FormModule
    heaterShakerModuleType: FormModule
  }
}

interface FlexProtocolEditorComponentProps {
  isEditValue: boolean
  tabIdValue: number
  formProps: any
  onSave: (args: {
    newProtocolFields: NewProtocolFields
    pipettes: PipetteFieldsData[]
    modules: ModuleCreationArgs[]
  }) => void
}

const validationSchema = Yup.object().shape({
  mountSide: Yup.string().required('Mount side is required'),
  pipettesByMount: Yup.object().shape({
    left: Yup.object().shape({
      pipetteName: Yup.string().required('First pipette is required'),
      // tiprackDefURI: Yup.array().min(
      //   1,
      //   'Select at least one tip rack for first pipette'
      // ),
      tiprackDefURI: Yup.string().required(
        'Select at least one tip rack for first pipette'
      ),
    }),
  }),
})

const getInitialValues = (
  values: any,
  matchingTiprackRight: any,
  matchingTiprackLeft: any
): InitialValues => {
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
      [MAGNETIC_BLOCK_TYPE]: {
        onDeck: false,
        model: MAGNETIC_BLOCK_V1,
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
    },
  }

  if (Boolean(values)) {
    const { formValues, instruments, modules } = values
    // Matching the form values
    initialFormValues.fields = {
      ...initialFormValues.fields,
      name: formValues.protocolName,
      ...formValues,
    }

    // Matching the pipette values
    initialFormValues.pipettesByMount.left.pipetteName =
      instruments.left?.pipetteSpecs?.name || ''
    initialFormValues.pipettesByMount.right.pipetteName =
      instruments.right?.pipetteSpecs?.name || ''

    // Matching the tip rack
    initialFormValues.pipettesByMount.left.tiprackDefURI =
      matchingTiprackLeft || []
    initialFormValues.pipettesByMount.right.tiprackDefURI =
      matchingTiprackRight || []

    // Matching the module values
    const moduleMappings = {
      heaterShakerModuleType: HEATERSHAKER_MODULE_TYPE,
      magneticModuleType: MAGNETIC_BLOCK_TYPE,
      temperatureModuleType: TEMPERATURE_MODULE_TYPE,
      thermocyclerModuleType: THERMOCYCLER_MODULE_TYPE,
    }

    Object.entries(moduleMappings).forEach(([moduleKey, moduleType]) => {
      if (modules[moduleKey]) {
        const module = modules[moduleKey]
        initialFormValues.modulesByType[moduleType].onDeck = true
        initialFormValues.modulesByType[moduleType].model = module.model
        initialFormValues.modulesByType[moduleType].slot = module.slot
      }
    })

    return initialFormValues
  }

  return initialFormValues
}

interface selectedTabProps {
  selectedTab: number
}

const SelectComponent = (selectedTab: number): JSX.Element | null => {
  const [is96ChannelSelected, setIs96ChangeSelected] = useState(false)
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
          <SelectPipetteOption
            pipetteName={left}
            changeIs96Selected={setIs96ChangeSelected}
            isLeft96ChannelSelected={is96ChannelSelected}
          />
          <SelectPipetteOption
            pipetteName={right}
            changeIs96Selected={setIs96ChangeSelected}
            isLeft96ChannelSelected={is96ChannelSelected}
          />
        </Flex>
      )
    case 2:
      return <FlexModules />
    default:
      return null
  }
}

const getTiprackValue = (tiprackName: string, tiprackOptions: any[]): any[] =>
  tiprackOptions
    .filter(tiprack => tiprackName?.includes(tiprack.name))
    .map(tiprack => tiprack.value)
function FlexProtocolEditor({
  isEditValue,
  tabIdValue,
  formProps,
  onSave,
}: FlexProtocolEditorComponentProps): JSX.Element {
  const dispatch = useDispatch()
  const [selectedTab, setTab] = useState<number>(0)
  const [redirectToDetails, setRedirectToDetails] = useState(false)
  const [isEdit, setEdit] = useState(false)
  const [matchingTiprackLeft, setMatchingTiprackLeft] = useState<string[]>([])
  const [matchingTiprackRight, setMatchingTiprackRight] = useState<string[]>([])

  const allLabware = useSelector(getLabwareDefsByURI)

  const rightTiprackNames = formProps?.instruments?.right?.tiprackModel
  const leftTiprackNames = formProps?.instruments?.left?.tiprackModel

  useEffect(() => {
    const newTiprackOptions = getFlexTiprackOptions(allLabware)
    setMatchingTiprackLeft(getTiprackValue(leftTiprackNames, newTiprackOptions))
    setMatchingTiprackRight(
      getTiprackValue(rightTiprackNames, newTiprackOptions)
    )
  }, [allLabware, leftTiprackNames, rightTiprackNames])

  useEffect(() => {
    if (isEditValue) {
      setEdit(isEditValue)
      setTab(tabIdValue)
    }
  }, [isEditValue, tabIdValue])

  // Next button click
  const handleNext = ({ selectedTab }: selectedTabProps): any => {
    if (isEdit) {
      return <FlexFileDetails />
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
  const notOnFirstPage = selectedTab !== 0

  const nextButton =
    selectedTab === navPillTabListLength
      ? isEdit
        ? i18n.t('flex.round_tabs.update')
        : i18n.t('flex.round_tabs.go_to_liquids_page')
      : isEdit
      ? i18n.t('flex.round_tabs.update')
      : i18n.t('flex.round_tabs.next')

  const handleSubmit = ({ values }: any): void => {
    const newProtocolFields = values.fields
    let pipettes = reduce<FormPipettesByMount, PipetteFieldsData[]>(
      values.pipettesByMount,
      (acc, formPipette: FormPipette, mount: string): PipetteFieldsData[] => {
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
    pipettes = pipettes.filter(
      item => item.name !== ('LEAVE_SECOND_EMPTY' as any)
    )

    onSave({ modules, newProtocolFields, pipettes })
    dispatch(
      setRobotType({ model: OT3_STANDARD_MODEL, deckId: OT3_STANDARD_DECKID })
    )
    if (isEdit) {
      setRedirectToDetails(true)
    } else {
      dispatch(navActions.navigateToPage('liquids'))
    }
  }

  return redirectToDetails ? (
    <FlexFileDetails />
  ) : (
    <>
      <CreateFlexFileForm />
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex>
          <FlexRoundTab
            setCurrentTab={setTab}
            currentTab={selectedTab}
            isEdit={isEditValue}
          />
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
              initialValues={getInitialValues(
                formProps,
                matchingTiprackRight,
                matchingTiprackLeft
              )}
              validateOnChange={true}
              validationSchema={notOnFirstPage && validationSchema}
              onSubmit={values => {
                selectedTab === 2 || isEdit
                  ? handleSubmit({ values })
                  : handleNext({ selectedTab })
              }}
            >
              {(props: {
                errors: any
                isValid: any
                handleSubmit: () => void
              }) => (
                <form onSubmit={props.handleSubmit}>
                  <section className={styles.editor_form}>
                    {SelectComponent(selectedTab)}
                  </section>
                  <div className={styles.flex_round_tabs_button_wrapper}>
                    {notOnFirstPage && !isEdit && (
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
                      disabled={notOnFirstPage && !props.isValid}
                      tabIndex={4}
                      type="submit"
                      className={`${styles.flex_round_tabs_button} ${
                        notOnFirstPage
                          ? styles.flex_round_tabs_button_50p
                          : styles.flex_round_tabs_button_100p
                      }`}
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
    </>
  )
}

interface CreateNewProtocolArgs {
  customLabware: LabwareDefByDefURI
  newProtocolFields: NewProtocolFields
  pipettes: PipetteFieldsData[]
  modules: ModuleCreationArgs[]
}

interface SP {
  _customLabware: LabwareDefByDefURI
  _hasUnsavedChanges?: boolean | null
}
interface DP {
  onCancel: () => unknown
  _createNewProtocol: (arg0: CreateNewProtocolArgs) => void
}
function mergeProps(stateProps: SP, dispatchProps: DP, ownProps: any): Props {
  const { isEditValue, tabIdValue, formProps } = ownProps.FlexFileDetails
  return {
    isEditValue,
    tabIdValue,
    formProps,
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
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(FlexProtocolEditor)
