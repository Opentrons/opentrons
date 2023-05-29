import {
  Card,
  DIRECTION_COLUMN,
  Flex,
  NewPrimaryBtn,
  SPACING,
  SecondaryButton,
} from '@opentrons/components'
import cx from 'classnames'
import { format } from 'date-fns'
import { Formik, FormikProps } from 'formik'
import { mapValues } from 'lodash'
import React, { useState } from 'react'
import { connect } from 'react-redux'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import {
  FileMetadataFields,
  actions,
  selectors as fileSelectors,
} from '../../../file-data'
import { i18n } from '../../../localization'
import { actions as navActions } from '../../../navigation'
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
import { FilePage } from '../../FilePage'
import { InstrumentGroup } from '../instrument/InstrumentGroup'
import { PageProps } from '../../LandingPage'
import { selectPageForms } from '../constant'
import { UpdateConfirmation } from '../FlexUpdateConfirmation'
export interface Props {
  formValues: FileMetadataFields
  instruments: React.ComponentProps<typeof InstrumentGroup>
  goToNextPage: () => unknown
  saveFileMetadata: (fileMetaDataFields: FileMetadataFields) => void
  swapPipettes: () => unknown
  modules: ModulesForEditModulesCard
}

type PropsData = React.ComponentProps<typeof FilePage>
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
  return (
    <div>
      {!Boolean(props.formValues.protocolName) ? (
        <NoFileSelection />
      ) : (
        <div className={flexStyles.wrapper}>
          <div className={flexStyles.main_page_wrapper}>
            <Formik
              enableReinitialize
              initialValues={props.formValues}
              onSubmit={props.saveFileMetadata}
            >
              {({
                handleChange,
                handleSubmit,
                dirty,
                touched,
                values,
              }: FormikProps<FileMetadataFields>) => (
                <form onSubmit={props.handleSubmit}>
                  <div className={styles.container}>
                    <FileProtocolInformation />
                    <div className={styles.line_separator} />
                    <FileProtocolNameAndDescription
                      nameDescriptionData={values}
                    />
                    <div className={styles.line_separator} />

                    <div
                      className={`${styles.heading_container} ${styles.margin_bottom}`}
                    >
                      <div className={styles.pd_file_tab_header}>
                        <StyledText as="h3">
                          {i18n.t('flex.file_tab.pipette')}
                        </StyledText>
                      </div>

                      <Flex className={styles.right_buttons}>
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
                        <EditButton />
                      </Flex>
                    </div>

                    <div>
                      <InstrumentGroup {...props.instruments} />
                    </div>

                    <div className={styles.line_separator} />
                    <StyledText as="h3" className={styles.margin_bottom}>
                      {i18n.t('flex.file_tab.additional_items')}
                    </StyledText>

                    <div
                      className={`${styles.heading_container} ${styles.margin_bottom}`}
                    >
                      <div className={styles.pd_file_tab_header}>
                        <SelectedModules propsData={props} />
                      </div>
                      <EditButton />
                    </div>
                    <SecondaryButton>
                      <div>{i18n.t('flex.file_tab.add_items')}</div>
                    </SecondaryButton>
                  </div>
                  <NewPrimaryBtn tabIndex={4} type="submit">
                    Create protocol, on to liquids
                  </NewPrimaryBtn>
                </form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  )
}

const FileProtocolInformation = (props: PageProps): JSX.Element => {
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleCancelClick = (): any => {
    props.setPageProps(selectPageForms.defaultLandingPage)
    setShowConfirmation(false)
  }

  const handleConfirmClick = (): any => {
    // TODO // handle the export action here

    props.setPageProps(selectPageForms.defaultLandingPage)
    setShowConfirmation(false)
  }

  function protocolCancelClick(): void {
    setShowConfirmation(true)
  }

  return (
    <>
      {Boolean(showConfirmation) && (
        <>
          <UpdateConfirmation
            confirmationTitle={'Close Protocol?'}
            confirmationMessage={
              'Are you sure you want to close this protocol? If you have not exported this file, you’ll lose all information'
            }
            cancelButtonName={'Close without exporting'}
            continueButtonName={'Export and close'}
            handleCancelClick={handleCancelClick}
            handleConfirmClick={handleConfirmClick}
          />
        </>
      )}
      <div className={styles.heading_container}>
        <div className={styles.pd_file_tab_header}>
          <StyledText as="h2">{i18n.t('flex.file_tab.heading')}</StyledText>
          <StyledText as="h5" className={styles.pd_file_tab_sub_header}>
            {i18n.t('flex.file_tab.subheading')}
          </StyledText>
        </div>
        <div className={styles.right_buttons}>
          <SecondaryButton>{i18n.t('flex.file_tab.export')}</SecondaryButton>
          <SecondaryButton
            className={styles.close_protocol_button}
            onClick={() => protocolCancelClick()}
          >
            {i18n.t('flex.file_tab.close_export')}
          </SecondaryButton>
        </div>
      </div>
    </>
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
        <EditButton />
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

const EditButton = (): JSX.Element => {
  return (
    <div className={styles.right_buttons}>
      <p>{i18n.t('flex.file_tab.edit')}</p>
    </div>
  )
}

const NoFileSelection = (): JSX.Element => {
  return (
    <div className={flexStyles.wrapper}>
      <div className={styles.container}>
        <div className={styles.pd_file_tab_header}>
          <StyledText as="h2">{i18n.t('flex.file_tab.heading')}</StyledText>
          <StyledText as="h5" className={styles.pd_file_tab_sub_header}>
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
    </div>
  )
}

const SelectedModules = (props: { propsData: any }): JSX.Element => {
  const { propsData } = props
  const existingModules = getModuleData(propsData.modules)
  return (
    <>
      {existingModules?.map((moduleType: any, i: number) => {
        return (
          <div
            className={`${styles.heading_container} ${styles.margin_bottom}`}
            key={i}
          >
            <div className={styles.pd_file_tab_header}>
              <Card>
                <div className={styles.card_content}>
                  <Flex>
                    {' '}
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
                        {moduleType.type === '"temperatureModuleType"'}
                        Temperature Module GEN - Slot {moduleType.slot}
                      </StyledText>
                    </Flex>
                  </Flex>
                </div>
              </Card>
            </div>
          </div>
        )
      })}
    </>
  )
}

function getModuleData(modules: any): any {
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
    goToNextPage: () => dispatch(navActions.navigateToPage('liquids')),
    saveFileMetadata: (nextFormValues: FileMetadataFields) =>
      dispatch(actions.saveFileMetadata(nextFormValues)),
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
