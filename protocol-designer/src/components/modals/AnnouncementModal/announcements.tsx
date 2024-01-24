import * as React from 'react'
import { Trans } from 'react-i18next'
import { css } from 'styled-components'
import {
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_AROUND,
  SPACING,
} from '@opentrons/components'

import styles from './AnnouncementModal.css'

export interface Announcement {
  announcementKey: string
  image: React.ReactNode | null
  heading: string
  message: React.ReactNode
}

interface AnnouncementProps {
  t: any
}

const batchEditStyles = css`
  justify-content: ${JUSTIFY_SPACE_AROUND};
  padding: ${SPACING.spacing16};

  & img {
    height: 13rem;
  }
`

const PD = 'Protocol Designer'
const APP = 'Opentrons App'
const OPENTRONS_PD = 'Opentrons Protocol Designer'

export const getAnnouncements = (props: AnnouncementProps): Announcement[] => {
  const { t } = props

  return [
    {
      announcementKey: 'modulesRequireRunAppUpdate',
      image: (
        <div className={styles.modules_diagrams_row}>
          <img
            className={styles.modules_diagram}
            src={require('../../../images/modules/magdeck_tempdeck_combined.png')}
          />
        </div>
      ),
      heading: t('header', { pd: PD }),
      message: (
        <>
          <p>{t('modulesRequireRunAppUpdate.body1', { pd: PD })}</p>
          <p>
            <Trans
              t={t}
              i18nKey={'modulesRequireRunAppUpdate.body2'}
              components={{ bold: <strong /> }}
              values={{ app: APP }}
            />
          </p>
        </>
      ),
    },
    {
      announcementKey: 'thermocyclerSupport',
      image: (
        <div className={styles.thermocycler_diagram_row}>
          <img
            className={styles.modules_diagram}
            src={require('../../../images/modules/thermocycler.jpg')}
          />
        </div>
      ),
      heading: t('header', { pd: PD }),
      message: (
        <>
          <p>{t('thermocyclerSupport.body1', { pd: PD })}</p>
          <p>
            <Trans
              t={t}
              i18nKey={'thermocyclerSupport.body2'}
              components={{ strong: <strong /> }}
              values={{ app: APP }}
            />
          </p>
        </>
      ),
    },
    {
      announcementKey: 'airGapDelaySettings',
      heading: t('header', { pd: PD }),
      image: null,
      message: (
        <>
          <p>{t('airGapDelaySettings.body1', { pd: PD })}</p>
          <p>
            <Trans
              t={t}
              i18nKey={'airGapDelaySettings.body2'}
              components={{ strong: <strong /> }}
              values={{ app: APP }}
            />
          </p>
        </>
      ),
    },
    {
      announcementKey: 'batchEditTransfer',
      image: (
        <Flex css={batchEditStyles}>
          <img
            src={require('../../../images/announcements/multi_select.gif')}
          />

          <img src={require('../../../images/announcements/batch_edit.gif')} />
        </Flex>
      ),
      heading: t('header', { pd: PD }),
      message: (
        <>
          <p>{t('batchEditTransfer.body1')}</p>
          <ul>
            <li>{t('batchEditTransfer.body2')}</li>
            <li>{t('batchEditTransfer.body3')}</li>
          </ul>

          <p>
            <Trans
              t={t}
              i18nKey={'batchEditTransfer.body4'}
              components={{ strong: <strong /> }}
            />
          </p>

          <p>{t('batchEditTransfer.body5')}</p>
        </>
      ),
    },
    {
      announcementKey: 'heaterShakerSupport',
      image: (
        <div className={styles.modules_diagrams_row}>
          <img
            className={styles.modules_diagram}
            src={require('../../../images/modules/heatershaker.png')}
          />
        </div>
      ),
      heading: t('header', { pd: PD }),
      message: (
        <>
          <p>{t('heaterShakerSupport.body1', { opd: OPENTRONS_PD })}</p>
          <p>
            <Trans
              t={t}
              i18nKey={'heaterShakerSupport.body2'}
              components={{ strong: <strong /> }}
              values={{ app: APP }}
            />
          </p>
        </>
      ),
    },
    {
      announcementKey: 'thermocyclerGen2Support',
      image: (
        <div className={styles.modules_diagrams_row}>
          <img
            className={styles.modules_diagram}
            src={require('../../../images/modules/thermocycler_gen2.png')}
          />
        </div>
      ),
      heading: t('header', { pd: PD }),
      message: (
        <>
          <p>{t('thermocyclerGen2Support.body1', { opd: OPENTRONS_PD })}</p>
          <p>
            <Trans
              t={t}
              i18nKey={'thermocyclerGen2Support.body2'}
              components={{ strong: <strong /> }}
              values={{ app: APP }}
            />
          </p>
        </>
      ),
    },
    {
      announcementKey: 'liquidColorEnhancements',
      image: (
        <div className={styles.modules_diagrams_color_enhancements}>
          <img
            className={styles.modules_diagram}
            src={require('../../../images/announcements/liquid-enhancements.gif')}
          />
        </div>
      ),
      heading: t('header', { pd: PD }),
      message: (
        <>
          <p>{t('liquidColorEnhancements.body1', { opd: OPENTRONS_PD })}</p>
          <p>
            <Trans
              t={t}
              i18nKey={'liquidColorEnhancements.body2'}
              components={{ strong: <strong /> }}
              values={{ app: APP }}
            />
          </p>
        </>
      ),
    },
    {
      announcementKey: 'flexSupport7.0',
      image: (
        <Flex justifyContent={JUSTIFY_CENTER}>
          <img
            height="240"
            width="240"
            src={require('../../../images/OpentronsFlex.png')}
          />
        </Flex>
      ),
      heading: t('header', { pd: PD }),
      message: (
        <>
          <p>{t('flexSupport7.0.body1', { pd: PD, flex: 'Opentrons Flex' })}</p>
          <p>
            <Trans
              t={t}
              i18nKey={'flexSupport7.0.body2'}
              components={{ strong: <strong /> }}
              values={{ app: APP }}
            />
          </p>
        </>
      ),
    },
    {
      announcementKey: 'deckConfigAnd96Channel8.0',
      image: (
        <Flex justifyContent={JUSTIFY_CENTER} paddingTop={SPACING.spacing8}>
          <img
            width="340"
            src={require('../../../images/deck_configuration.png')}
          />
        </Flex>
      ),
      heading: t('header', { pd: PD }),
      message: (
        <>
          <p>{t('deckConfigAnd96Channel8.0.body1', { pd: PD })}</p>
          <p>
            <Trans
              t={t}
              i18nKey={'deckConfigAnd96Channel8.0.body2'}
              components={{ strong: <strong /> }}
              values={{ app: APP }}
            />
          </p>
        </>
      ),
    },
  ]
}
