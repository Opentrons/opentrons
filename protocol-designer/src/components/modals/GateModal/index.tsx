import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import cx from 'classnames'
import { AlertModal } from '@opentrons/components'
import {
  actions as analyticsActions,
  selectors as analyticsSelectors,
} from '../../../analytics'
import settingsStyles from '../../SettingsPage/SettingsPage.css'
import modalStyles from '../modal.css'

export function GateModal(): JSX.Element | null {
  const { t } = useTranslation(['card', 'button'])
  const hasOptedIn = useSelector(analyticsSelectors.getHasOptedIn)
  const dispatch = useDispatch()

  if (hasOptedIn == null) {
    return (
      <AlertModal
        alertOverlay
        className={cx(modalStyles.modal, modalStyles.blocking)}
        buttons={[
          {
            onClick: () => dispatch(analyticsActions.optOut()),
            children: t('button:no'),
          },
          {
            onClick: () => dispatch(analyticsActions.optIn()),
            children: t('button:yes'),
          },
        ]}
      >
        <h3>{t('toggle.share_session')}</h3>
        <div className={settingsStyles.body_wrapper}>
          <p className={settingsStyles.card_body}>
            {t('body.reason_for_collecting_data')}
          </p>
          <ul className={settingsStyles.card_point_list}>
            <li>{t('body.data_collected_is_internal')}</li>
            <li>{t('body.data_only_from_pd')}</li>
            <li>{t('body.opt_out_of_data_collection')}</li>
          </ul>
        </div>
      </AlertModal>
    )
  } else {
    return null
  }
}
