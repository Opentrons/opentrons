import * as React from 'react'
import { Formik, FormikProps } from 'formik'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import {
  InstrumentGroup,
  SecondaryButton,
  Flex,
  Card,
  DIRECTION_COLUMN,
  SPACING,
  NewPrimaryBtn,
} from '@opentrons/components'
import { ConnectedNav } from '../../../containers/ConnectedNav'
import { FileMetadataFields } from '../../../file-data'
import { i18n } from '../../../localization'
import { ModulesForEditModulesCard } from '../../../step-forms'
import { ModuleDiagram } from '../../modules'
import { StyledText } from '../StyledText'
import styles from '../FlexFileDetails/FlexFileDetails.css'
import flexStyles from '../FlexComponents.css'

export interface Props {
  formValues: FileMetadataFields
  instruments: React.ComponentProps<typeof InstrumentGroup>
  goToNextPage: () => unknown
  saveFileMetadata: (fileMetaDataFields: FileMetadataFields) => void
  swapPipettes: () => unknown
  modules: ModulesForEditModulesCard
}

// TODO(mc, 2020-02-28): explore l10n for these dates
const DATE_ONLY_FORMAT = 'MMM dd, yyyy'
const DATETIME_FORMAT = 'MMM dd, yyyy | h:mm a'

export function FlexFileDetailsComponent(props: any): JSX.Element {
  console.log('props.formValues', props.formValues)
  console.log('props.formValues', props.formValues.protocolName)

  function getModuleData(modules: any): any {
    const moduleData = []
    for (const obj in modules) {
      if (modules[obj] != null) moduleData.push(modules[obj])
    }
    return moduleData
  }

  return (
    <div>
      {!Boolean(props.formValues.protocolName) ? (
        <>
          <div className={flexStyles.wrapper}>
            <ConnectedNav />
            <div className={styles.container}>
              <div className={styles.pd_file_tab_header}>
                <StyledText as="h2">
                  {i18n.t('flex.file_tab.heading')}
                </StyledText>
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
        </>
      ) : (
        <>
          <div className={flexStyles.wrapper}>
            <ConnectedNav />
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
                      <div className={styles.heading_container}>
                        <div className={styles.pd_file_tab_header}>
                          <StyledText as="h2">
                            {i18n.t('flex.file_tab.heading')}
                          </StyledText>
                          <StyledText
                            as="h5"
                            className={styles.pd_file_tab_sub_header}
                          >
                            {i18n.t('flex.file_tab.subheading')}
                          </StyledText>
                        </div>

                        <div className={styles.right_buttons}>
                          <SecondaryButton>
                            {i18n.t('flex.file_tab.export')}
                          </SecondaryButton>
                          <SecondaryButton
                            className={styles.close_protocol_button}
                          >
                            {i18n.t('flex.file_tab.close_export')}
                          </SecondaryButton>
                        </div>
                      </div>

                      <div className={styles.line_separator} />
                      <div>
                        <div
                          className={`${styles.heading_container} ${styles.margin_bottom}`}
                        >
                          <StyledText as="h3" className={styles.margin_bottom}>
                            {i18n.t('flex.file_tab.name_desc_title')}
                          </StyledText>
                          <div className={styles.right_buttons}>
                            <Link to={'/ot-flex/0'}>
                              {i18n.t('flex.file_tab.edit')}
                            </Link>
                          </div>
                        </div>
                        <Flex className={styles.margin_bottom}>
                          <StyledText as="h4" className={styles.bold_text}>
                            {i18n.t('flex.file_tab.name')}
                          </StyledText>
                          <StyledText as="h5" className={styles.name_margin}>
                            {values.protocolName}
                          </StyledText>
                        </Flex>
                        <Flex className={styles.margin_bottom}>
                          <StyledText as="h4" className={styles.bold_text}>
                            {i18n.t('flex.file_tab.author')}
                          </StyledText>
                          <StyledText as="h5" className={styles.author_margin}>
                            {values.author}
                          </StyledText>
                        </Flex>
                        <Flex className={styles.margin_bottom}>
                          <StyledText as="h4" className={styles.bold_text}>
                            {i18n.t('flex.file_tab.description')}
                          </StyledText>
                          <StyledText as="h5" className={styles.desc_margin}>
                            {values.description}
                          </StyledText>
                        </Flex>
                        <Flex className={styles.margin_bottom}>
                          <StyledText as="h4" className={styles.bold_text}>
                            {i18n.t('flex.file_tab.date_created')}
                          </StyledText>
                          <StyledText as="h5" className={styles.desc_margin}>
                            {values.created &&
                              format(values.created, DATE_ONLY_FORMAT)}
                          </StyledText>
                        </Flex>
                        <Flex className={styles.margin_bottom}>
                          <StyledText as="h4" className={styles.bold_text}>
                            {i18n.t('flex.file_tab.last_exported')}
                          </StyledText>
                          <StyledText as="h5" className={styles.desc_margin}>
                            {values.lastModified &&
                              format(values.lastModified, DATETIME_FORMAT)}
                          </StyledText>
                        </Flex>
                      </div>

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
                          <SecondaryButton
                            onClick={e => {
                              e.preventDefault()
                              props.swapPipettes()
                            }}
                          >
                            {i18n.t('flex.file_tab.swap_pipette')}
                          </SecondaryButton>
                          <Link to={'/ot-flex/1'} style={{ marginLeft: 10 }}>
                            {i18n.t('flex.file_tab.edit')}
                          </Link>
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
                          {getModuleData(props.modules).map(
                            (moduleType: any, i: number) => {
                              return (
                                <>
                                  <div
                                    className={`${styles.heading_container} ${styles.margin_bottom}`}
                                    key={i}
                                  >
                                    <div
                                      className={styles.pd_file_tab_header}
                                      style={{ width: '21rem' }}
                                    >
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
                                              marginTop={SPACING.spacing3}
                                              marginBottom={SPACING.spacing4}
                                            >
                                              <StyledText as="h4">
                                                {moduleType.type ===
                                                  '"temperatureModuleType"'}
                                                Temperature Module GEN - Slot{' '}
                                                {moduleType.slot}
                                              </StyledText>
                                            </Flex>
                                          </Flex>
                                        </div>
                                      </Card>
                                    </div>
                                  </div>
                                </>
                              )
                            }
                          )}
                        </div>
                        <div className={styles.right_buttons}>
                          <Link to={'/ot-flex/2'}>
                            {i18n.t('flex.file_tab.edit')}
                          </Link>
                        </div>
                      </div>
                      <SecondaryButton>
                        <Link to={'/ot-flex/2'}>
                          {i18n.t('flex.file_tab.add_items')}
                        </Link>
                      </SecondaryButton>
                    </div>
                    <NewPrimaryBtn
                      style={{ margin: 20, float: 'right' }}
                      tabIndex={4}
                      type="submit"
                    >
                      Create protocol, on to liquids
                    </NewPrimaryBtn>
                  </form>
                )}
              </Formik>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export const FlexFileDetails = FlexFileDetailsComponent
