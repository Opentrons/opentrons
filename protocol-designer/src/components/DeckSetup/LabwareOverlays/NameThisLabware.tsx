import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import cx from 'classnames'
import { Icon, useOnClickOutside } from '@opentrons/components'
import { renameLabware } from '../../../labware-ingred/actions'
import styles from './LabwareOverlays.css'

import type { LabwareEntity } from '@opentrons/step-generation'
import type { ThunkDispatch } from '../../../types'
import type { LabwareOnDeck } from '../../../step-forms'

interface NameThisLabwareProps {
  labwareOnDeck: LabwareOnDeck | LabwareEntity
  editLiquids: () => void
}

export const NameThisLabware = (props: NameThisLabwareProps): JSX.Element => {
  const { labwareOnDeck } = props
  const dispatch: ThunkDispatch<any> = useDispatch()
  const [inputValue, setInputValue] = React.useState<string>('')
  const { t } = useTranslation('deck')

  const setLabwareName = (name: string | null | undefined): void => {
    dispatch(renameLabware({ labwareId: labwareOnDeck.id, name }))
  }

  const saveNickname = (): void => {
    setLabwareName(inputValue ?? null)
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
          placeholder={t('overlay.name_labware.nickname_placeholder')}
          value={inputValue}
        />
      </div>
      <a className={styles.overlay_button} onClick={addLiquids}>
        <Icon className={styles.overlay_icon} name="water" />
        {t('overlay.name_labware.add_liquids')}
      </a>
      <a className={styles.overlay_button} onClick={saveNickname}>
        <Icon className={styles.overlay_icon} name="ot-water-outline" />
        {t('overlay.name_labware.leave_empty')}
      </a>
    </div>
  )
}
