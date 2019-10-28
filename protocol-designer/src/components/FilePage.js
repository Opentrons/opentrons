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
import i18n from '../localization'
import { Portal } from './portals/MainPageModalPortal'
import styles from './FilePage.css'
import EditPipettesModal from './modals/EditPipettesModal'
import { EditModulesCard } from './modules'
import formStyles from '../components/forms/forms.css'
import type { FileMetadataFields } from '../file-data'
import type { ModulesForEditModulesCard } from '../step-forms'

export type Props = {
  formValues: FileMetadataFields,
  instruments: React.ElementProps<typeof InstrumentGroup>,
  goToNextPage: () => mixed,
  saveFileMetadata: FileMetadataFields => mixed,
  swapPipettes: () => mixed,
  modulesEnabled: ?boolean,
}

type State = { isEditPipetteModalOpen: boolean, isEditModuleModalOpen: boolean }

const DATE_ONLY_FORMAT = 'MMM DD, YYYY'
const DATETIME_FORMAT = 'MMM DD, YYYY | h:mm A'

const _mockModulesByType: ModulesForEditModulesCard = {
  magdeck: {
    moduleId: 'module1234',
    slot: '1',
    model: 'GEN1',
  },
}

// TODO: Ian 2019-03-15 use i18n for labels
class FilePage extends React.Component<Props, State> {
  state = { isEditPipetteModalOpen: false, isEditModuleModalOpen: false }

  openEditPipetteModal = () => this.setState({ isEditPipetteModalOpen: true })
  closeEditPipetteModal = () => this.setState({ isEditPipetteModalOpen: false })

  render() {
    const {
      formValues,
      instruments,
      goToNextPage,
      saveFileMetadata,
      swapPipettes,
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
          <EditModulesCard modules={_mockModulesByType} />
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
            <EditPipettesModal
              key={String(this.state.isEditPipetteModalOpen)}
              closeModal={this.closeEditPipetteModal}
            />
          )}
        </Portal>
      </div>
    )
  }
}

export default FilePage
