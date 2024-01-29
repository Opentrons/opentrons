import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_AROUND,
  SPACING,
} from '@opentrons/components'

import styles from './AnnouncementModal.module.css'

export interface Announcement {
  announcementKey: string
  image: React.ReactNode | null
  heading: string
  message: React.ReactNode
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

export const useAnnouncements = (): Announcement[] => {
  const { t } = useTranslation('modal')

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
      heading: t('announcements.header', { pd: PD }),
      message: (
        <>
          <p>
            {t('announcements.modulesRequireRunAppUpdate.body1', { pd: PD })}
          </p>
          <p>
            <Trans
              t={t}
              i18nKey={'announcements.modulesRequireRunAppUpdate.body2'}
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
      heading: t('announcements.header', { pd: PD }),
      message: (
        <>
          <p>{t('announcements.thermocyclerSupport.body1', { pd: PD })}</p>
          <p>
            <Trans
              t={t}
              i18nKey={'announcements.thermocyclerSupport.body2'}
              components={{ strong: <strong /> }}
              values={{ app: APP }}
            />
          </p>
        </>
      ),
    },
    {
      announcementKey: 'airGapDelaySettings',
      heading: t('announcements.header', { pd: PD }),
      image: null,
      message: (
        <>
          <p>{t('announcements.airGapDelaySettings.body1', { pd: PD })}</p>
          <p>
            <Trans
              t={t}
              i18nKey={'announcements.airGapDelaySettings.body2'}
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
      heading: t('announcements.header', { pd: PD }),
      message: (
        <>
          <p>{t('announcements.batchEditTransfer.body1')}</p>
          <ul>
            <li>{t('announcements.batchEditTransfer.body2')}</li>
            <li>{t('announcements.batchEditTransfer.body3')}</li>
          </ul>

          <p>
            <Trans
              t={t}
              i18nKey={'announcements.batchEditTransfer.body4'}
              components={{ strong: <strong /> }}
            />
          </p>

          <p>{t('announcements.batchEditTransfer.body5')}</p>
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
      heading: t('announcements.header', { pd: PD }),
      message: (
        <>
          <p>
            {t('announcements.heaterShakerSupport.body1', {
              opd: OPENTRONS_PD,
            })}
          </p>
          <p>
            <Trans
              t={t}
              i18nKey={'announcements.heaterShakerSupport.body2'}
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
      heading: t('announcements.header', { pd: PD }),
      message: (
        <>
          <p>
            {t('announcements.thermocyclerGen2Support.body1', {
              opd: OPENTRONS_PD,
            })}
          </p>
          <p>
            <Trans
              t={t}
              i18nKey={'announcements.thermocyclerGen2Support.body2'}
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
      heading: t('announcements.header', { pd: PD }),
      message: (
        <>
          <p>
            {t('announcements.liquidColorEnhancements.body1', {
              opd: OPENTRONS_PD,
            })}
          </p>
          <p>
            <Trans
              t={t}
              i18nKey={'announcements.liquidColorEnhancements.body2'}
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
      heading: t('announcements.header', { pd: PD }),
      message: (
        <>
          <p>
            {t('announcements.flexSupport.body1', {
              pd: PD,
              flex: 'Opentrons Flex',
            })}
          </p>
          <p>
            <Trans
              t={t}
              i18nKey={'announcements.flexSupport.body2'}
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
      heading: t('announcements.header', { pd: PD }),
      message: (
        <>
          <p>{t('announcements.deckConfigAnd96Channel.body1', { pd: PD })}</p>
          <p>
            <Trans
              t={t}
              i18nKey={'announcements.deckConfigAnd96Channel.body2'}
              components={{ strong: <strong /> }}
              values={{ app: APP }}
            />
          </p>
        </>
      ),
    },
  ]
}
