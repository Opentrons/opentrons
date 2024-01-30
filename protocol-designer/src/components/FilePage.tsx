import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import mapValues from 'lodash/mapValues'
import { Formik, FormikProps } from 'formik'
import { format } from 'date-fns'
import cx from 'classnames'

import {
  Card,
  FormGroup,
  InputField,
  InstrumentGroup,
  OutlineButton,
  DeprecatedPrimaryButton,
} from '@opentrons/components'
import { resetScrollElements } from '../ui/steps/utils'
import { Portal } from './portals/MainPageModalPortal'
import { EditModulesCard } from './modules'
import { EditModules } from './EditModules'
import { actions, selectors as fileSelectors } from '../file-data'
import { actions as navActions } from '../navigation'
import { actions as steplistActions } from '../steplist'
import { selectors as stepFormSelectors } from '../step-forms'
import { INITIAL_DECK_SETUP_STEP_ID } from '../constants'
import { FilePipettesModal } from './modals/FilePipettesModal'
import styles from './FilePage.css'
import modalStyles from '../components/modals/modal.css'
import formStyles from '../components/forms/forms.css'

import type { ModuleType } from '@opentrons/shared-data'
import type { FileMetadataFields } from '../file-data'

// TODO(mc, 2020-02-28): explore l10n for these dates
const DATE_ONLY_FORMAT = 'MMM dd, yyyy'
const DATETIME_FORMAT = 'MMM dd, yyyy | h:mm a'
export const FilePage = (): JSX.Element => {
  const { t } = useTranslation(['button', 'application'])
  const dispatch = useDispatch()

  const formValues = useSelector(fileSelectors.getFileMetadata)
  const instruments = useSelector(
    stepFormSelectors.getPipettesForInstrumentGroup
  )
  const modules = useSelector(stepFormSelectors.getModulesForEditModulesCard)
  const initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const [
    isEditPipetteModalOpen,
    setEditPipetteModalOpen,
  ] = React.useState<boolean>(false)
  const [moduleToEdit, setModuleToEdit] = React.useState<{
    moduleType: ModuleType
    moduleId?: string | null
  } | null>(null)

  const swapPipetteUpdate = mapValues(initialDeckSetup.pipettes, pipette => {
    if (!pipette.mount) return pipette.mount
    return pipette.mount === 'left' ? 'right' : 'left'
  })

  const openEditPipetteModal = (): void => {
    resetScrollElements()
    setEditPipetteModalOpen(true)
  }

  const closeEditPipetteModal = (): void => {
    setEditPipetteModalOpen(false)
  }
  const handleEditModule = (
    moduleType: ModuleType,
    moduleId?: string | null
  ): void => {
    resetScrollElements()
    setModuleToEdit({ moduleType: moduleType, moduleId: moduleId })
  }

  const closeEditModulesModal = (): void => {
    setModuleToEdit(null)
  }

  const saveFileMetadata = (nextFormValues: FileMetadataFields): void => {
    dispatch(actions.saveFileMetadata(nextFormValues))
  }

  return (
    <div className={styles.file_page}>
      <Card title={t('application:information')}>
        <Formik
          enableReinitialize
          initialValues={formValues}
          onSubmit={saveFileMetadata}
        >
          {({
            handleChange,
            handleSubmit,
            dirty,
            touched,
            values,
          }: FormikProps<FileMetadataFields>) => (
            <form onSubmit={handleSubmit} className={styles.card_content}>
              <div
                className={cx(
                  formStyles.row_wrapper,
                  formStyles.stacked_row_large
                )}
              >
                <FormGroup
                  label={t('application:date_created')}
                  className={formStyles.column_1_2}
                >
                  {values.created && format(values.created, DATE_ONLY_FORMAT)}
                </FormGroup>

                <FormGroup
                  label={t('application:last_exported')}
                  className={formStyles.column_1_2}
                >
                  {values.lastModified &&
                    format(values.lastModified, DATETIME_FORMAT)}
                </FormGroup>
              </div>

              <div
                className={cx(formStyles.row_wrapper, formStyles.stacked_row)}
              >
                <FormGroup
                  label={t('application:protocol_name')}
                  className={formStyles.column_1_2}
                >
                  <InputField
                    placeholder="Untitled"
                    name="protocolName"
                    onChange={handleChange}
                    value={values.protocolName}
                  />
                </FormGroup>

                <FormGroup
                  label={t('application:organization_author')}
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
                label={t('application:description')}
                className={formStyles.stacked_row}
              >
                <InputField
                  name="description"
                  value={values.description}
                  onChange={handleChange}
                />
              </FormGroup>
              <div className={modalStyles.button_row}>
                <OutlineButton
                  type="submit"
                  className={styles.update_button}
                  disabled={!dirty}
                >
                  {dirty ? t('application:update') : t('application:updated')}
                </OutlineButton>
              </div>
            </form>
          )}
        </Formik>
      </Card>

      <Card title={t('application:pipettes')}>
        <div className={styles.card_content}>
          <InstrumentGroup {...instruments} showMountLabel />
          <div className={styles.pipette_button_row}>
            <DeprecatedPrimaryButton
              onClick={openEditPipetteModal}
              className={styles.edit_button}
              name="editPipettes"
            >
              {t('edit')}
            </DeprecatedPrimaryButton>
            <OutlineButton
              onClick={() =>
                dispatch(
                  steplistActions.changeSavedStepForm({
                    stepId: INITIAL_DECK_SETUP_STEP_ID,
                    update: {
                      pipetteLocationUpdate: swapPipetteUpdate,
                    },
                  })
                )
              }
              className={styles.swap_button}
              iconName="swap-horizontal"
              name="swapPipettes"
              disabled={instruments?.left?.pipetteSpecs?.channels === 96}
            >
              {t('swap')}
            </OutlineButton>
          </div>
        </div>
      </Card>

      <EditModulesCard
        modules={modules}
        openEditModuleModal={handleEditModule}
      />

      <div className={modalStyles.button_row}>
        <DeprecatedPrimaryButton
          onClick={() => dispatch(navActions.navigateToPage('liquids'))}
          className={styles.continue_button}
          iconName="arrow-right"
          name="continueToLiquids"
        >
          {t('continue_to_liquids')}
        </DeprecatedPrimaryButton>
      </div>

      <Portal>
        {isEditPipetteModalOpen && (
          <FilePipettesModal closeModal={closeEditPipetteModal} />
        )}
        {moduleToEdit != null && (
          <EditModules
            moduleToEdit={moduleToEdit}
            onCloseClick={closeEditModulesModal}
          />
        )}
      </Portal>
    </div>
  )
}
