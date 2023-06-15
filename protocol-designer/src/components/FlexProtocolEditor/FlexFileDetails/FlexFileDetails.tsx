import React, { useEffect, useState } from 'react'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DropdownField,
  Flex,
  FormGroup,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  OutlineButton,
  SPACING,
  SecondaryButton,
} from '@opentrons/components'
import cx from 'classnames'
import { format } from 'date-fns'
import { Formik, FormikProps, useFormikContext } from 'formik'
import { mapValues } from 'lodash'
import { connect, useDispatch, useSelector } from 'react-redux'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import {
  FileMetadataFields,
  selectors as fileSelectors,
} from '../../../file-data'
import { i18n } from '../../../localization'
import {
  InitialDeckSetup,
  ModulesForEditModulesCard,
  selectors as stepFormSelectors,
} from '../../../step-forms'
import { actions as steplistActions } from '../../../steplist'
import { BaseState, ThunkDispatch } from '../../../types'
import { ModuleDiagram } from '../../modules'
import { StyledText } from '../StyledText'

import flexStyles from '../FlexComponents.css'
import styles from '../FlexFileDetails/FlexFileDetails.css'
import { InstrumentGroup } from '../FlexInstrument/InstrumentGroup'
import { FlexProtocolEditorComponent } from '../FlexProtocolEditor'
import { actions as navActions } from '../../../navigation'
import { UpdateConfirmation } from '../FlexUpdateConfirmation'
import { MiniCard } from '../FlexModules/MiniCard'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  OT3_STANDARD_MODEL,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getAllFlexModuleSlotsByType } from '../FlexModules/FlexModuleData'
import { ConnectedSlotMap } from '../../modals/EditModulesModal/ConnectedSlotMap'
import { validator } from '../FlexModules/validator'
import { PDAlert } from '../../alerts/PDAlert'
import { moveDeckItem } from '../../../labware-ingred/actions'

export interface Props {
  formValues: FileMetadataFields
  instruments: React.ComponentProps<typeof InstrumentGroup>
  swapPipettes: () => unknown
  modules: ModulesForEditModulesCard
}

type PropsData = React.ComponentProps<typeof FlexFileDetailsComponent>
interface SP {
  instruments: PropsData['instruments']
  formValues: PropsData['formValues']
  _initialDeckSetup: InitialDeckSetup
  modules: PropsData['modules']
}

// TODO(mc, 2020-02-28): explore l10n for these dates
const DATE_ONLY_FORMAT = 'MMM dd, yyyy'
const DATETIME_FORMAT = 'MMM dd, yyyy | h:mm a'

interface SupportedSlots {
  [key: string]: string
}

const supportedSlots: SupportedSlots = {
  [MAGNETIC_MODULE_TYPE]: 'GEN1',
  [TEMPERATURE_MODULE_TYPE]: 'GEN2',
  [THERMOCYCLER_MODULE_TYPE]: 'GEN2',
  [HEATERSHAKER_MODULE_TYPE]: 'GEN1',
  [MAGNETIC_BLOCK_TYPE]: 'GEN1',
}

export function FlexFileDetailsComponent(props: any): JSX.Element {
  const [isEdit, setEdit] = useState(false)
  const [selectedTabId, setTabId] = useState<number>(0)

  if (isEdit) {
    return (
      <FlexProtocolEditorComponent
        FlexFileDetails={{
          isEditValue: isEdit,
          tabIdValue: selectedTabId,
          formProps: props,
        }}
      />
    )
  } else {
    return (
      <div>
        {!Boolean(props.formValues) ? (
          <NoFileSelection />
        ) : (
          <div className={flexStyles.wrapper}>
            <div className={flexStyles.main_page_wrapper}>
              <Formik
                enableReinitialize
                initialValues={props}
                onSubmit={props.handleSubmit}
              >
                {({
                  handleSubmit,
                  values,
                }: FormikProps<FileMetadataFields>) => (
                  <form onSubmit={handleSubmit}>
                    <div className={styles.container}>
                      <FileProtocolInformation />
                      <div className={styles.line_separator} />
                      <div
                        className={`${styles.heading_container} ${styles.margin_bottom}`}
                      >
                        <FileProtocolNameAndDescription
                          nameDescriptionData={values}
                        />
                        <Flex>
                          <EditButton
                            editProps={setEdit}
                            setTab={0}
                            setTabId={setTabId}
                          />
                        </Flex>
                      </div>
                      <div className={styles.line_separator} />
                      <div
                        className={`${styles.heading_container} ${styles.margin_bottom}`}
                      >
                        <StyledText as="h3">
                          {i18n.t('flex.file_tab.pipette')}
                        </StyledText>
                        <Flex>
                          {Object.keys(props.instruments).length !== 1 && (
                            <SecondaryButton
                              onClick={e => {
                                e.preventDefault()
                                props.swapPipettes()
                              }}
                              className={styles.margin_right}
                            >
                              {i18n.t('flex.file_tab.swap_pipette')}
                            </SecondaryButton>
                          )}
                          <EditButton
                            editProps={setEdit}
                            setTab={1}
                            setTabId={setTabId}
                          />
                        </Flex>
                      </div>
                      <div>
                        <InstrumentGroup {...props.instruments} />
                      </div>
                      <div className={styles.line_separator} />

                      <div
                        className={`${styles.heading_container} ${styles.margin_bottom}`}
                      >
                        <StyledText as="h3" className={styles.margin_bottom}>
                          {i18n.t('flex.file_tab.modules')}
                        </StyledText>
                        {/* <Flex>
                          <EditButton
                            editProps={setEdit}
                            setTab={2}
                            setTabId={setTabId}
                          />
                        </Flex> */}
                      </div>
                      {!props?.modules?.length ? (
                        <SelectedModules {...props} />
                      ) : (
                        <NoSelectedModule />
                      )}
                      <EditButton
                        editProps={setEdit}
                        setTab={2}
                        setTabId={setTabId}
                        addItems={true}
                      />
                    </div>
                  </form>
                )}
              </Formik>
            </div>
          </div>
        )}
      </div>
    )
  }
}

const FileProtocolInformation = (): JSX.Element => {
  const dispatch = useDispatch()
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleCancelClick = (): any => {
    setShowConfirmation(false)
  }
  const handleConfirmClick = (): any => {
    // handle the update action here
    dispatch(navActions.navigateToPage('landing-page'))
    setShowConfirmation(false)
  }

  function protocolCancelClick(e: { preventDefault: () => void }): any {
    e.preventDefault()
    setShowConfirmation(true)
  }
  return (
    <>
      {Boolean(showConfirmation) && (
        <>
          <UpdateConfirmation
            confirmationTitle={i18n.t(
              'flex.cancel_create_protocol.confirmation_title'
            )}
            confirmationMessage={i18n.t(
              'flex.cancel_create_protocol.confirmation_message'
            )}
            cancelButtonName={i18n.t(
              'flex.cancel_create_protocol.cancel_button_name'
            )}
            continueButtonName={i18n.t(
              'flex.cancel_create_protocol.continue_button_name'
            )}
            handleCancelClick={handleCancelClick}
            handleConfirmClick={handleConfirmClick}
          />
        </>
      )}
      <div className={styles.heading_container}>
        <div className={styles.pd_fd_header}>
          <StyledText as="h2">{i18n.t('flex.file_tab.heading')}</StyledText>
          <StyledText as="h5" className={styles.pd_fd_sub_header}>
            {i18n.t('flex.file_tab.subheading')}
          </StyledText>
        </div>
        <FlexHeadingButtonGroup
          protocolCancelClickProps={protocolCancelClick}
        />
      </div>
    </>
  )
}

export const FlexHeadingButtonGroup = (props: {
  protocolCancelClickProps: any
}): JSX.Element => {
  const { protocolCancelClickProps } = props
  return (
    <div className={styles.right_buttons}>
      <SecondaryButton>{i18n.t('flex.file_tab.export')}</SecondaryButton>
      <SecondaryButton
        className={styles.close_protocol_button}
        onClick={e => protocolCancelClickProps(e)}
      >
        {i18n.t('flex.file_tab.close_export')}
      </SecondaryButton>
    </div>
  )
}

const NoFileSelection = (): JSX.Element => {
  return (
    <div className={flexStyles.wrapper}>
      <div className={styles.container}>
        <StyledText as="h2">{i18n.t('flex.file_tab.heading')}</StyledText>
        <StyledText as="h5" className={styles.pd_fd_sub_header}>
          {i18n.t('flex.file_tab.subheading')}
        </StyledText>
        <div className={styles.line_separator} />
        <div>
          <StyledText as="h4" className={styles.bold_text}>
            {i18n.t('flex.file_tab.invalid_json')}
          </StyledText>
        </div>
      </div>
    </div>
  )
}

// File related information name and description etc.
const FileProtocolNameAndDescription = (props: {
  nameDescriptionData: any
}): JSX.Element => {
  const { nameDescriptionData } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      className={cx(styles.heading_container, styles.margin_bottom)}
    >
      <StyledText as="h3" className={styles.margin_bottom}>
        {i18n.t('flex.file_tab.name_desc_title')}
      </StyledText>

      <ShowProtocolBasicData
        data={nameDescriptionData.protocolName}
        title={i18n.t('flex.file_tab.name')}
        style={styles.name_margin}
      />

      <ShowProtocolBasicData
        data={nameDescriptionData.author}
        title={i18n.t('flex.file_tab.author')}
        style={styles.author_margin}
      />

      <ShowProtocolBasicData
        data={nameDescriptionData.description}
        title={i18n.t('flex.file_tab.description')}
        style={styles.desc_margin}
      />

      <ShowProtocolBasicData
        data={
          nameDescriptionData.created &&
          format(nameDescriptionData.created, DATE_ONLY_FORMAT)
        }
        title={i18n.t('flex.file_tab.date_created')}
        style={styles.created_margin}
      />

      <ShowProtocolBasicData
        data={
          nameDescriptionData.lastModified &&
          format(nameDescriptionData.lastModified, DATETIME_FORMAT)
        }
        title={i18n.t('flex.file_tab.last_exported')}
        style={styles.other_margin}
      />
    </Flex>
  )
}

interface ShowProtocolBasicDataProps {
  title: string
  data: string
  style?: string
}

const ShowProtocolBasicData: React.FC<ShowProtocolBasicDataProps> = ({
  title,
  data,
  style,
}): JSX.Element => {
  return (
    <Flex className={styles.margin_bottom}>
      <StyledText as="h4" className={styles.bold_text}>
        {title}
      </StyledText>
      <StyledText as="h5" className={style}>
        {data}
      </StyledText>
    </Flex>
  )
}

const EditButton = ({
  editProps,
  setTab,
  setTabId,
  addItems,
}: any): JSX.Element => {
  return (
    <SecondaryButton
      style={{ height: 'max-content' }}
      onClick={e => {
        e.preventDefault()
        editProps(true)
        setTabId(setTab)
      }}
    >
      {addItems
        ? i18n.t('flex.file_tab.add_items')
        : i18n.t('flex.file_tab.edit')}
    </SecondaryButton>
  )
}

const NoSelectedModule = () => (
  <StyledText as="h4">{i18n.t('flex.file_tab.no_modules_found')}</StyledText>
)

const SelectedModules = (props: any): JSX.Element => {
  return (
    <>
      {getModuleData(props.modules).map((moduleType: any, i: number) => (
        <div key={i} className={styles.module_outer_border}>
          <SingleModuleRender {...moduleType} />
        </div>
      ))}
    </>
  )

  function SingleModuleRender(moduleOnDeck: any): JSX.Element {
    const { values, handleChange, handleBlur } = useFormikContext<any>()
    const initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
    const dispatch = useDispatch()
    const type = moduleOnDeck?.type
    const model = moduleOnDeck?.model
    const [slotIssue, setSlotIssue] = useState<string | null>(null)

    useEffect(() => {
      if (values.modules[type].slot !== moduleOnDeck.slot) {
        const error = validator({
          selectedModel: values.modules[type],
          selectedType: moduleOnDeck?.type,
          initialDeckSetup,
        })
        error?.selectedSlot &&
          error?.selectedSlot.includes('occupied') &&
          setSlotIssue(error.selectedSlot)
      }
    }, [moduleOnDeck])

    const moveDeckSlot = (selectedSlot: string) => {
      if (selectedSlot && moduleOnDeck && moduleOnDeck.slot !== selectedSlot) {
        dispatch(moveDeckItem(moduleOnDeck.slot, selectedSlot))
      }
    }

    return (
      <>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex className={styles.module_card}>
            <MiniCard isSelected={type}>
              <Flex>
                <ModuleDiagram type={type} model={model} />
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  justifyContent={ALIGN_CENTER}
                  marginLeft={SPACING.spacing4}
                  marginTop={SPACING.spacing4}
                  marginBottom={SPACING.spacing4}
                >
                  <StyledText as="h4">
                    {i18n.t(`modules.module_display_names.${type}`)}- Slot{' '}
                    {values.modules[type].slot}
                  </StyledText>
                </Flex>
              </Flex>
            </MiniCard>
          </Flex>

          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="h5">Model:</StyledText>
            <StyledText as="p">{supportedSlots[type]}</StyledText>
          </Flex>

          <Flex>
            <FormGroup label="Position" className={styles.model_options}>
              <DropdownField
                tabIndex={1}
                name={`modules.${type}.slot`}
                options={getAllFlexModuleSlotsByType(type)}
                value={values.modules[type].slot}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </FormGroup>
          </Flex>

          <ConnectedSlotMap
            fieldName={`modules.${type}.slot`}
            robotType={OT3_STANDARD_MODEL}
          />
        </Flex>
        <Flex className={styles.slot_issue_warning}>
          {slotIssue && (
            <PDAlert
              alertType="warning"
              title={i18n.t('alert.module_placement.SLOT_OCCUPIED.title')}
              description={slotIssue}
            />
          )}
        </Flex>
        <Flex
          justifyContent={JUSTIFY_END}
          className={styles.slot_issue_warning}
        >
          {values.modules[type].slot !== moduleOnDeck.slot && (
            <Flex>
              <OutlineButton
                disabled={Boolean(slotIssue)}
                onClick={() => moveDeckSlot(values.modules[type].slot)}
                className={styles.button_margin}
                type="submit"
              >
                SAVE
              </OutlineButton>
            </Flex>
          )}
        </Flex>
      </>
    )
  }
}

export function getModuleData(modules: any): any {
  const moduleData = []
  for (const obj in modules) {
    if (modules[obj] != null) moduleData.push(modules[obj])
  }
  return moduleData
}

const mapStateToProps = (state: BaseState): SP => {
  return {
    formValues: fileSelectors.getFileMetadata(state),
    instruments: stepFormSelectors.getPipettesForInstrumentGroup(state),
    modules: stepFormSelectors.getModulesForEditModulesCard(state),
    _initialDeckSetup: stepFormSelectors.getInitialDeckSetup(state),
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: {
    dispatch: ThunkDispatch<any>
  }
): Props {
  const { _initialDeckSetup, ...passThruProps } = stateProps
  const { dispatch } = dispatchProps
  const swapPipetteUpdate = mapValues(_initialDeckSetup.pipettes, pipette => {
    if (!pipette.mount) return pipette.mount
    return pipette.mount === 'left' ? 'right' : 'left'
  })
  return {
    ...passThruProps,
    swapPipettes: () =>
      dispatch(
        steplistActions.changeSavedStepForm({
          stepId: INITIAL_DECK_SETUP_STEP_ID,
          update: {
            pipetteLocationUpdate: swapPipetteUpdate,
          },
        })
      ),
  }
}

export const FlexFileDetails = connect(
  mapStateToProps,
  // @ts-expect-error(sa, 2021-6-21): TODO: refactor to use hooks api
  null,
  mergeProps
)(FlexFileDetailsComponent)
