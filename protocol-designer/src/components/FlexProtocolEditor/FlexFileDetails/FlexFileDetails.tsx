import {
  Card,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  SecondaryButton,
} from '@opentrons/components'
import cx from 'classnames'
import { format } from 'date-fns'
import { Formik, FormikProps } from 'formik'
import { mapValues } from 'lodash'
import React, { useState } from 'react'
import { connect, useDispatch } from 'react-redux'
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
                initialValues={props.formValues}
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
                          {i18n.t('flex.file_tab.additional_items')}
                        </StyledText>
                        <Flex>
                          <EditButton
                            editProps={setEdit}
                            setTab={2}
                            setTabId={setTabId}
                          />
                        </Flex>
                      </div>
                      <SelectedModules propsData={props} />
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
            confirmationTitle={'Cancel Create Protocol?'}
            confirmationMessage={
              'Are you sure you want to cancel creating a protocol? Progress will be lost, You can’t undo this change.'
            }
            cancelButtonName={'Go back'}
            continueButtonName={'Cancel New Protocol'}
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
            Please select JSON file to display
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
    <div>
      <Flex className={cx(styles.heading_container, styles.margin_bottom)}>
        <StyledText as="h3" className={styles.margin_bottom}>
          {i18n.t('flex.file_tab.name_desc_title')}
        </StyledText>
      </Flex>
      <Flex className={styles.margin_bottom}>
        <StyledText as="h4" className={styles.bold_text}>
          {i18n.t('flex.file_tab.name')}
        </StyledText>
        <StyledText as="h5" className={styles.name_margin}>
          {nameDescriptionData.protocolName}
        </StyledText>
      </Flex>
      <Flex className={styles.margin_bottom}>
        <StyledText as="h4" className={styles.bold_text}>
          {i18n.t('flex.file_tab.author')}
        </StyledText>
        <StyledText as="h5" className={styles.author_margin}>
          {nameDescriptionData.author}
        </StyledText>
      </Flex>
      <Flex className={styles.margin_bottom}>
        <StyledText as="h4" className={styles.bold_text}>
          {i18n.t('flex.file_tab.description')}
        </StyledText>
        <StyledText as="h5" className={styles.desc_margin}>
          {nameDescriptionData.description}
        </StyledText>
      </Flex>
      <Flex className={styles.margin_bottom}>
        <StyledText as="h4" className={styles.bold_text}>
          {i18n.t('flex.file_tab.date_created')}
        </StyledText>
        <StyledText as="h5" className={styles.desc_margin}>
          {nameDescriptionData.created &&
            format(nameDescriptionData.created, DATE_ONLY_FORMAT)}
        </StyledText>
      </Flex>
      <Flex className={styles.margin_bottom}>
        <StyledText as="h4" className={styles.bold_text}>
          {i18n.t('flex.file_tab.last_exported')}
        </StyledText>
        <StyledText as="h5" className={styles.desc_margin}>
          {nameDescriptionData.lastModified &&
            format(nameDescriptionData.lastModified, DATETIME_FORMAT)}
        </StyledText>
      </Flex>
    </div>
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

const SelectedModules = (props: { propsData: any }): JSX.Element => {
  const { propsData } = props
  const existingModules = getModuleData(propsData.modules)
  return (
    <>
      {existingModules?.length > 0 ? (
        existingModules.map((moduleType: any, i: number) => (
          <div
            className={` ${styles.card_width} ${styles.margin_bottom}`}
            key={i}
          >
            <Card>
              <div className={styles.card_content}>
                <Flex>
                  <ModuleDiagram
                    type={moduleType.type}
                    model={moduleType.model}
                  />
                  <Flex
                    flexDirection={DIRECTION_COLUMN}
                    marginLeft={SPACING.spacing4}
                    marginTop={SPACING.spacing4}
                    marginBottom={SPACING.spacing4}
                  >
                    <StyledText as="h4">
                      {i18n.t(
                        `modules.module_display_names.${moduleType.type}`
                      )}
                      - Slot {moduleType.slot}
                    </StyledText>
                  </Flex>
                </Flex>
              </div>
            </Card>
          </div>
        ))
      ) : (
        <StyledText as="h4">
          {i18n.t('flex.file_tab.no_modules_found')}
        </StyledText>
      )}
    </>
  )
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
