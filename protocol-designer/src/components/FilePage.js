// @flow
import * as React from 'react'
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
import type {FormConnector} from '../utils'
import {Portal} from './portals/MainPageModalPortal'
import styles from './FilePage.css'
import EditPipettesModal from './modals/EditPipettesModal'
import formStyles from '../components/forms.css'

export type Props = {
  formConnector: FormConnector<any>,
  isFormAltered: boolean,
  instruments: React.ElementProps<typeof InstrumentGroup>,
  goToNextPage: () => mixed,
  saveFileMetadata: () => mixed,
  swapPipettes: () => mixed,
}

type State = { isEditPipetteModalOpen: boolean }

// TODO IMMEDIATELY don't use placeholder, really pass in the timestamp
const todo_placeholder = 92345678
const DATE_ONLY_FORMAT = 'MMM DD, YYYY'
const DATETIME_FORMAT = 'MMM DD, YYYY | h:mm A'

class FilePage extends React.Component<Props, State> {
  state = {isEditPipetteModalOpen: false}

  handleSubmit = (e: SyntheticEvent<*>) => {
    // blur focused field on submit
    if (document && document.activeElement) document.activeElement.blur()
    this.props.saveFileMetadata()
    e.preventDefault()
  }

  openEditPipetteModal = () => this.setState({isEditPipetteModalOpen: true})
  closeEditPipetteModal = () => this.setState({isEditPipetteModalOpen: false})

  render () {
    const {formConnector, isFormAltered, instruments, goToNextPage, swapPipettes} = this.props

    return (
      <div className={styles.file_page}>
        <Card title='Information'>
          <form onSubmit={this.handleSubmit} className={styles.card_content}>
            <div className={cx(formStyles.row_wrapper, formStyles.stacked_row)}>
              <FormGroup label='Date Created:' className={formStyles.column_1_2}>
                {moment(todo_placeholder).format(DATE_ONLY_FORMAT)}
              </FormGroup>

              <FormGroup label='Last Exported:' className={formStyles.column_1_2}>
                {moment(todo_placeholder).format(DATETIME_FORMAT)}
              </FormGroup>
            </div>

            <div className={cx(formStyles.row_wrapper, formStyles.stacked_row)}>
              <FormGroup label='Protocol Name:' className={formStyles.column_1_2}>
                <InputField placeholder='Untitled' {...formConnector('protocol-name')} />
              </FormGroup>

              <FormGroup label='Organization/Author:' className={formStyles.column_1_2}>
                <InputField {...formConnector('author')} />
              </FormGroup>
            </div>

            <FormGroup label='Description:' className={formStyles.stacked_row}>
              <InputField {...formConnector('description')}/>
            </FormGroup>
            <div className={styles.button_row}>
              <OutlineButton type="submit" className={styles.update_button} disabled={!isFormAltered}>
                {isFormAltered ? 'UPDATE' : 'UPDATED'}
              </OutlineButton>
            </div>
          </form>
        </Card>

        <Card title='Pipettes'>
          <div className={styles.card_content}>
            <InstrumentGroup {...instruments} showMountLabel />
            <div className={styles.pipette_button_row}>
              <PrimaryButton onClick={this.openEditPipetteModal} className={styles.edit_button} >
                {i18n.t('button.edit')}
              </PrimaryButton>
              <OutlineButton
                onClick={swapPipettes}
                className={styles.swap_button}
                iconName='swap-horizontal'>
                {i18n.t('button.swap')}
              </OutlineButton>
            </div>
          </div>
        </Card>

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
          {this.state.isEditPipetteModalOpen &&
            <EditPipettesModal key={String(this.state.isEditPipetteModalOpen)} closeModal={this.closeEditPipetteModal} />}
        </Portal>
      </div>
    )
  }
}

export default FilePage
