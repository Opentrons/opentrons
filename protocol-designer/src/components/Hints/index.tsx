import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import {
  AlertModal,
  DeprecatedCheckboxField,
  Flex,
  OutlineButton,
  Text,
} from '@opentrons/components'
import { actions, selectors, HintKey } from '../../tutorial'
import { Portal } from '../portals/MainPageModalPortal'
import styles from './hints.module.css'
import EXAMPLE_ADD_LIQUIDS_IMAGE from '../../images/example_add_liquids.png'
import EXAMPLE_WATCH_LIQUIDS_MOVE_IMAGE from '../../images/example_watch_liquids_move.png'
import EXAMPLE_BATCH_EDIT_IMAGE from '../../images/announcements/multi_select.gif'

const HINT_IS_ALERT: HintKey[] = ['add_liquids_and_labware']

export const Hints = (): JSX.Element | null => {
  const { t } = useTranslation(['alert', 'nav', 'button'])
  const [rememberDismissal, toggleRememberDismissal] = React.useState<boolean>(
    false
  )
  const hintKey = useSelector(selectors.getHint)
  const dispatch = useDispatch()
  const removeHint = (hintKey: HintKey): void => {
    dispatch(actions.removeHint(hintKey, rememberDismissal))
  }

  const makeHandleCloseClick = (hintKey: HintKey): (() => void) => {
    return () => removeHint(hintKey)
  }

  const renderHintContents = (hintKey: HintKey): JSX.Element | null => {
    // Only hints that have no outside effects should go here.
    // For hints that have an effect, use BlockingHint.
    switch (hintKey) {
      case 'add_liquids_and_labware':
        return (
          <>
            <div className={styles.summary}>
              {t('hint.add_liquids_and_labware.summary', {
                deck_setup_step: t('nav:terminal_item.__initial_setup__'),
              })}
            </div>

            <span className={styles.column_left}>
              <div className={styles.step_description}>
                <span>Step 1: </span>
                <span>{t('hint.add_liquids_and_labware.step1')}</span>
              </div>
              <img src={EXAMPLE_ADD_LIQUIDS_IMAGE} />
            </span>

            <span className={styles.column_right}>
              <div className={styles.step_description}>
                <span>Step 2: </span>
                <span>{t('hint.add_liquids_and_labware.step2')}</span>
              </div>
              <img src={EXAMPLE_WATCH_LIQUIDS_MOVE_IMAGE} />
            </span>
          </>
        )
      case 'deck_setup_explanation':
        return (
          <>
            <p>{t(`hint.${hintKey}.body1`)}</p>
            <p>{t(`hint.${hintKey}.body2`)}</p>
            <p>{t(`hint.${hintKey}.body3`)}</p>
          </>
        )
      case 'module_without_labware':
        return (
          <>
            <p>{t(`alert:hint.${hintKey}.body`)}</p>
          </>
        )
      case 'thermocycler_lid_passive_cooling':
        return (
          <>
            <p>
              {t(`alert:hint.${hintKey}.body1a`)}
              <strong>{t(`alert:hint.${hintKey}.strong_body1`)}</strong>
              {t(`alert:hint.${hintKey}.body1b`)}
            </p>
            <ol className={styles.numbered_list}>
              <li>
                <span>{t(`alert:hint.${hintKey}.li1`)}</span>
              </li>
              <li>
                <span>{t(`alert:hint.${hintKey}.li2`)}</span>
              </li>
            </ol>
          </>
        )
      case 'protocol_can_enter_batch_edit':
        return (
          <>
            <span className={styles.column_left}>
              <img src={EXAMPLE_BATCH_EDIT_IMAGE} />
            </span>
            <span className={styles.column_right}>
              <p>{t(`alert:hint.${hintKey}.body1`)}</p>
              <p>
                {`alert:hint.${hintKey}.body2`}
                <ol className={styles.numbered_list}>
                  <li>
                    {t(`alert:hint.${hintKey}.li1a`)}
                    <strong>{t(`alert:hint.${hintKey}.strong_li1`)}</strong>
                    {t(`alert:hint.${hintKey}.li1b`)}
                  </li>
                  <li>
                    {t(`alert:hint.${hintKey}.li2a`)}
                    <strong>{t(`alert:hint.${hintKey}.strong_li2`)}</strong>
                    {t(`alert:hint.${hintKey}.li2b`)}
                  </li>
                </ol>
              </p>
              <p>
                {t(`alert:hint.${hintKey}.body3a`)} <br />
                {t(`alert:hint.${hintKey}.body3b`)}
              </p>
              <p>
                {t(`alert:hint.${hintKey}.body4a`)} <br />
                {t(`alert:hint.${hintKey}.body4b`)}
              </p>
            </span>
          </>
        )
      case 'waste_chute_warning':
        return (
          <Flex>
            <Text>{t(`hint.${hintKey}.body1`)}</Text>
          </Flex>
        )
      default:
        return null
    }
  }

  if (!hintKey) return null

  const headingText = t(`hint.${hintKey}.title`)
  const hintIsAlert = HINT_IS_ALERT.includes(hintKey)
  return (
    <Portal>
      <AlertModal alertOverlay heading={hintIsAlert ? headingText : null}>
        {!hintIsAlert ? (
          <div className={styles.heading}>{headingText}</div>
        ) : null}
        <div className={styles.hint_contents}>
          {renderHintContents(hintKey)}
        </div>
        <div>
          <DeprecatedCheckboxField
            className={styles.dont_show_again}
            label={t('hint.dont_show_again')}
            onChange={() => toggleRememberDismissal(rememberDismissal)}
            value={rememberDismissal}
          />
          <OutlineButton
            className={styles.ok_button}
            onClick={makeHandleCloseClick(hintKey)}
          >
            {t('button:ok')}
          </OutlineButton>
        </div>
      </AlertModal>
    </Portal>
  )
}
