// @flow
import * as React from 'react'
import { Formik } from 'formik'
import moment from 'moment'
import {
  Card,
  FormGroup,
  InputField,
  InstrumentGroup,
  OutlineButton,
  PrimaryButton,
} from '@opentrons/components'
import cx from 'classnames'
import { i18n } from '../localization'
import { Portal } from './portals/MainPageModalPortal'
import { EditPipettesModal } from './modals/EditPipettesModal'
import { EditModulesModal } from './modals/EditModulesModal'
import { EditModulesCard } from './modules'
import styles from './FilePage.css'
import formStyles from '../components/forms/forms.css'
import type { FileMetadataFields } from '../file-data'
import type { ModulesForEditModulesCard } from '../step-forms'
import type { ModuleType } from '@opentrons/shared-data'
export type Props = {|
  formValues: FileMetadataFields,
  instruments: React.ElementProps<typeof InstrumentGroup>,
  goToNextPage: () => mixed,
  saveFileMetadata: FileMetadataFields => mixed,
  swapPipettes: () => mixed,
  modulesEnabled: ?boolean,
  thermocyclerEnabled: ?boolean,
  modules: ModulesForEditModulesCard,
|}

type State = {|
  isEditPipetteModalOpen: boolean,
  isEditModulesModalOpen: boolean,
  currentModule: {|
    moduleType: ?ModuleType,
    moduleId: ?string,
  |},
|}

const DATE_ONLY_FORMAT = 'MMM DD, YYYY'
const DATETIME_FORMAT = 'MMM DD, YYYY | h:mm A'

// TODO: Ian 2019-03-15 use i18n for labels
export class FilePage extends React.Component<Props, State> {
  state = {
    isEditPipetteModalOpen: false,
    isEditModulesModalOpen: false,
    currentModule: {
      moduleType: null,
      moduleId: null,
    },
  }

  // TODO (ka 2019-10-28): This is a workaround, see #4446
  // but it solves the modal positioning problem caused by main page wrapper
  // being positioned absolute until we can figure out something better
  scrollToTop = () => {
    const editPage = document.getElementById('main-page')
    if (editPage) editPage.scrollTop = 0
  }

  openEditPipetteModal = () => {
    this.scrollToTop()
    this.setState({ isEditPipetteModalOpen: true })
  }
  closeEditPipetteModal = () => this.setState({ isEditPipetteModalOpen: false })

  handleEditModule = (moduleType: ModuleType, moduleId?: string) => {
    this.scrollToTop()
    this.setState({
      isEditModulesModalOpen: true,
      currentModule: { moduleType: moduleType, moduleId: moduleId },
    })
  }

  closeEditModulesModal = () => {
    this.setState({
      isEditModulesModalOpen: false,
      currentModule: { moduleType: null, moduleId: null },
    })
  }

  render() {
    const {
      formValues,
      instruments,
      goToNextPage,
      saveFileMetadata,
      swapPipettes,
      modules,
    } = this.props

    return (
      <div className={styles.file_page}>
        <Card title="Information">
          <Formik
            enableReinitialize
            initialValues={formValues}
            onSubmit={saveFileMetadata}
            render={({
              handleBlur,
              handleChange,
              handleSubmit,
              dirty,
              errors,
              setFieldValue,
              touched,
              values,
            }) => (
              <form onSubmit={handleSubmit} className={styles.card_content}>
                <div
                  className={cx(formStyles.row_wrapper, formStyles.stacked_row)}
                >
                  <FormGroup
                    label="Date Created"
                    className={formStyles.column_1_2}
                  >
                    {values.created &&
                      moment(values.created).format(DATE_ONLY_FORMAT)}
                  </FormGroup>

                  <FormGroup
                    label="Last Exported"
                    className={formStyles.column_1_2}
                  >
                    {values['last-modified'] &&
                      moment(values['last-modified']).format(DATETIME_FORMAT)}
                  </FormGroup>
                </div>

                <div
                  className={cx(formStyles.row_wrapper, formStyles.stacked_row)}
                >
                  <FormGroup
                    label="Protocol Name"
                    className={formStyles.column_1_2}
                  >
                    <InputField
                      placeholder="Untitled"
                      name="protocolName"
                      onChange={handleChange}
                      value={values['protocolName']}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Organization/Author"
                    className={formStyles.column_1_2}
                  >
                    <InputField
                      name="author"
                      onChange={handleChange}
                      value={values.author}
                    />
                  </FormGroup>
                </div>

                <FormGroup
                  label="Description"
                  className={formStyles.stacked_row}
                >
                  <InputField
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                  />
                </FormGroup>
                <div className={styles.button_row}>
                  <OutlineButton
                    type="submit"
                    className={styles.update_button}
                    disabled={!dirty}
                  >
                    {dirty ? 'UPDATE' : 'UPDATED'}
                  </OutlineButton>
                </div>
              </form>
            )}
          />
        </Card>

        <Card title="Pipettes">
          <div className={styles.card_content}>
            <InstrumentGroup {...instruments} showMountLabel />
            <div className={styles.pipette_button_row}>
              <PrimaryButton
                onClick={this.openEditPipetteModal}
                className={styles.edit_button}
              >
                {i18n.t('button.edit')}
              </PrimaryButton>
              <OutlineButton
                onClick={swapPipettes}
                className={styles.swap_button}
                iconName="swap-horizontal"
              >
                {i18n.t('button.swap')}
              </OutlineButton>
            </div>
          </div>
        </Card>

        {this.props.modulesEnabled && (
          <EditModulesCard
            modules={modules}
            thermocyclerEnabled={this.props.thermocyclerEnabled}
            openEditModuleModal={this.handleEditModule}
          />
        )}

        <div className={styles.button_row}>
          <PrimaryButton
            onClick={goToNextPage}
            className={styles.continue_button}
            iconName="arrow-right"
          >
            {i18n.t('button.continue_to_liquids')}
          </PrimaryButton>
        </div>

        <Portal>
          {this.state.isEditPipetteModalOpen && (
            <EditPipettesModal closeModal={this.closeEditPipetteModal} />
          )}

          {this.state.isEditModulesModalOpen &&
            this.state.currentModule.moduleType && (
              <EditModulesModal
                moduleType={this.state.currentModule.moduleType}
                moduleId={this.state.currentModule.moduleId}
                onCloseClick={this.closeEditModulesModal}
              />
            )}
        </Portal>
      </div>
    )
  }
}
