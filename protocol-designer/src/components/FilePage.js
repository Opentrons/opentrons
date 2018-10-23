// @flow
import * as React from 'react'
import {
  Card,
  FormGroup,
  InputField,
  InstrumentGroup,
  OutlineButton,
  PrimaryButton,
} from '@opentrons/components'
import i18n from '../localization'
import type {FormConnector} from '../utils'
import {Portal} from './portals/MainPageModalPortal'
import styles from './FilePage.css'
import EditPipettesModal from '../components/modals/EditPipettesModal'
import formStyles from '../components/forms.css'

export type Props = {
  formConnector: FormConnector<any>,
  isFormAltered: boolean,
  instruments: React.ElementProps<typeof InstrumentGroup>,
  goToNextPage: () => mixed,
  saveFileMetadata: () => mixed,
  swapPipettes: () => mixed,
  editPipettes: () => mixed,
}

type State = { isEditPipetteModalOpen: boolean }

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
            <div className={formStyles.row_wrapper}>
              <FormGroup label='Protocol Name:' className={formStyles.column_1_2}>
                <InputField placeholder='Untitled' {...formConnector('protocol-name')} />
              </FormGroup>

              <FormGroup label='Organization/Author:' className={formStyles.column_1_2}>
                <InputField {...formConnector('author')} />
              </FormGroup>
            </div>

            <FormGroup label='Description:'>
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
            <OutlineButton
              onClick={swapPipettes}
              className={styles.swap_button}
              iconName='swap-horizontal'>
              Swap
            </OutlineButton>
            <OutlineButton onClick={this.openEditPipetteModal} className={styles.swap_button} >
              Edit
            </OutlineButton>
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
            <EditPipettesModal key={this.state.isEditPipetteModalOpen} closeModal={this.closeEditPipetteModal} />}
        </Portal>
      </div>
    )
  }
}

export default FilePage
