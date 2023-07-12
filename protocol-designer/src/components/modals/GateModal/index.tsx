import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import cx from 'classnames'
import { AlertModal } from '@opentrons/components'
import {
  actions as analyticsActions,
  selectors as analyticsSelectors,
} from '../../../analytics'
import { BaseState, ThunkDispatch } from '../../../types'
import settingsStyles from '../../SettingsPage/SettingsPage.css'
import modalStyles from '../modal.css'
interface Props {
  hasOptedIn: boolean | null
  optIn: () => unknown
  optOut: () => unknown
}

interface SP {
  hasOptedIn: Props['hasOptedIn']
}

interface DP {
  optIn: Props['optIn']
  optOut: Props['optOut']
}

const GateModalComponent: React.FC<Props> = ({ optIn, optOut, hasOptedIn }) => {
  const { t } = useTranslation(['card', 'button'])

  if (hasOptedIn == null) {
    return (
      <AlertModal
        alertOverlay
        className={cx(modalStyles.modal, modalStyles.blocking)}
        buttons={[
          { onClick: optOut, children: t('button:no') },
          { onClick: optIn, children: t('button:yes') },
        ]}
      >
        <h3>{t('toggle.share_session')}</h3>
        <div className={settingsStyles.body_wrapper}>
          <p className={settingsStyles.card_body}>
            {t('body.reason_for_collecting_data')}
          </p>
          <ul className={settingsStyles.card_point_list}>
            <li>{t('body.data_collected_is_internal')}</li>
            {/* TODO: BC 2018-09-26 uncomment when only using fullstory <li>{i18n.t('card.body.data_only_from_pd')}</li> */}
            <li>{t('body.opt_out_of_data_collection')}</li>
          </ul>
        </div>
      </AlertModal>
    )
  }

  return null
}

function mapStateToProps(state: BaseState): SP {
  return { hasOptedIn: analyticsSelectors.getHasOptedIn(state) }
}

function mapDispatchToProps(dispatch: ThunkDispatch<any>): DP {
  return {
    optIn: () => dispatch(analyticsActions.optIn()),
    optOut: () => dispatch(analyticsActions.optOut()),
  }
}

export const GateModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(GateModalComponent)
