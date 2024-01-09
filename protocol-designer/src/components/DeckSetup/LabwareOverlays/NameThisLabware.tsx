import * as React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { Icon, useOnClickOutside } from '@opentrons/components'
import { renameLabware } from '../../../labware-ingred/actions'
import { i18n } from '../../../localization'
import styles from './LabwareOverlays.css'
import type { LabwareEntity } from '@opentrons/step-generation'
import type { ThunkDispatch } from '../../../types'
import type { LabwareOnDeck } from '../../../step-forms'

interface OP {
  labwareOnDeck: LabwareOnDeck | LabwareEntity
  editLiquids: () => unknown
}

interface DP {
  // TODO Ian 2018-02-16 type these fns elsewhere and import the type
  setLabwareName: (name: string | null | undefined) => unknown
}

type Props = OP & DP

const NameThisLabwareComponent = (props: Props): JSX.Element => {
  const [inputValue, setInputValue] = React.useState('')

  const saveNickname = (): void => {
    props.setLabwareName(inputValue || null)
  }
  const wrapperRef: React.RefObject<HTMLDivElement> = useOnClickOutside({
    onClickOutside: saveNickname,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value)
  }

  const handleKeyUp = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      saveNickname()
    }
  }
  const addLiquids = (): void => {
    saveNickname()
    props.editLiquids()
  }

  return (
    <div className={cx(styles.slot_overlay, styles.with_form)} ref={wrapperRef}>
      <div className={styles.name_input_wrapper}>
        <input
          className={styles.name_input}
          onChange={handleChange}
          onKeyUp={handleKeyUp}
          placeholder={i18n.t('deck.overlay.name_labware.nickname_placeholder')}
          value={inputValue}
        />
      </div>
      <a className={styles.overlay_button} onClick={addLiquids}>
        <Icon className={styles.overlay_icon} name="water" />
        {i18n.t('deck.overlay.name_labware.add_liquids')}
      </a>
      <a className={styles.overlay_button} onClick={saveNickname}>
        <Icon className={styles.overlay_icon} name="ot-water-outline" />
        {i18n.t('deck.overlay.name_labware.leave_empty')}
      </a>
    </div>
  )
}

const mapDispatchToProps = (dispatch: ThunkDispatch<any>, ownProps: OP): DP => {
  const { id } = ownProps.labwareOnDeck
  return {
    setLabwareName: (name: string | null | undefined) =>
      dispatch(renameLabware({ labwareId: id, name })),
  }
}

export const NameThisLabware = connect(
  null,
  mapDispatchToProps
)(NameThisLabwareComponent)
