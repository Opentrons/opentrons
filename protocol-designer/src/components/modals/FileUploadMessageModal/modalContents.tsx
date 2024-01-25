import * as React from 'react'
import { Trans } from 'react-i18next'
import assert from 'assert'
import { FileUploadMessage } from '../../../load-file'
import type { ModalContents } from './types'

import styles from './modalContents.css'

const PD = 'Protocol Designer'

interface ModalProps {
  t: any
  errorMessage?: string | null
}

const getInvalidFileType = (props: ModalProps): ModalContents => {
  const { t } = props
  return {
    title: t('incorrect_file.header'),
    body: (
      <>
        <p>{t('incorrect_file.body1', { pd: PD })}</p>
        <p>{t('incorrect_file.body2')}.</p>
      </>
    ),
  }
}

const invalidJsonModal = (props: ModalProps): ModalContents => {
  const { t, errorMessage } = props
  return {
    title: t('invalid.header'),
    body: (
      <>
        <p>{t('invalid.body1', { pd: PD })}</p>
        <p>{t('invalid.body2', { pd: PD })}</p>
        <p>{t('invalid.body3', { pd: PD })}</p>

        <div className={styles.error_wrapper}>
          <p>{t('invalid.error')}</p>
          <p className={styles.error_text}>{errorMessage}</p>
        </div>
      </>
    ),
  }
}

export const getGenericDidMigrateMessage = (
  props: ModalProps
): ModalContents => {
  const { t } = props

  return {
    title: t('migrations.header', { pd: PD }),
    body: (
      <>
        <p>{t('migrations.generic.body1', { pd: PD })}</p>
        <p>{t('migrations.generic.body2', { pd: PD })}</p>
        <p>{t('migrations.generic.body3')}</p>
      </>
    ),
  }
}

export const getNoBehaviorChangeMessage = (
  props: ModalProps
): ModalContents => {
  const { t } = props

  return {
    title: t('migrations.header', { pd: PD }),
    body: (
      <div className={styles.migration_message}>
        <p>{t('migrations.noBehaviorChange.body1')}</p>
        <p>{t('migrations.noBehaviorChange.body2')}</p>
        <p>{t('migrations.noBehaviorChange.body3')}</p>
      </div>
    ),
  }
}

export const getToV8MigrationMessage = (props: ModalProps): ModalContents => {
  const { t } = props

  return {
    title: t('migrations.header', { pd: PD }),
    body: (
      <div className={styles.migration_message}>
        <p>
          <p>{t('migrations.toV8Migration.body1')}</p>
        </p>
        <p>{t('migrations.toV8Migration.body2', { pd: PD })}</p>
        <p>{t('migrations.toV8Migration.body3')}</p>
        <p>{t('migrations.toV8Migration.body4')}</p>
      </div>
    ),
  }
}

export const getToV3MigrationMessage = (props: ModalProps): ModalContents => {
  const { t } = props

  return {
    title: t('migrations.toV3Migration.title'),
    okButtonText: t('migrations.toV3Migration.button'),
    body: (
      <div className={styles.migration_message}>
        <p>
          <Trans
            t={t}
            i18nKey="migrations.toV3Migration.body1"
            components={{ strong: <strong /> }}
          />
        </p>
        <div className={styles.section_header}>
          {t('migrations.toV3Migration.body2')}
        </div>
        <p>{t('migrations.toV3Migration.body3')}</p>
        <div className={styles.section_header}>
          {t('migrations.toV3Migration.body4')}
        </div>
        <div>
          <p>{t('migrations.toV3Migration.body5')}</p>
        </div>
        <div className={styles.note}>{t('migrations.toV3Migration.body6')}</div>
      </div>
    ),
  }
}

interface MigrationMessageProps {
  migrationsRan: string[]
  t: any
}

export function getMigrationMessage(
  props: MigrationMessageProps
): ModalContents {
  const { t, migrationsRan } = props

  if (migrationsRan.includes('3.0.0')) {
    return getToV3MigrationMessage({ t })
  }
  const noBehaviorMigrations = [
    ['5.0.0'],
    ['5.0.0', '5.1.0'],
    ['5.0.0', '5.1.0', '5.2.0'],
  ]
  if (
    noBehaviorMigrations.some(migrationList =>
      migrationsRan.every(migration => migrationList.includes(migration))
    )
  ) {
    return getNoBehaviorChangeMessage({ t })
  }
  if (migrationsRan.includes('8.0.0')) {
    return getToV8MigrationMessage({ t })
  }
  return getGenericDidMigrateMessage({ t })
}

interface ModalContentsProps {
  uploadResponse: FileUploadMessage
  t: any
}
export function getModalContents(props: ModalContentsProps): ModalContents {
  const { t, uploadResponse } = props
  if (uploadResponse.isError) {
    switch (uploadResponse.errorType) {
      case 'INVALID_FILE_TYPE':
        return getInvalidFileType({ t })
      case 'INVALID_JSON_FILE':
        return invalidJsonModal({
          errorMessage: uploadResponse.errorMessage,
          t,
        })
      default: {
        console.warn('Invalid error type specified for modal')
        return { title: 'Error', body: 'Error' }
      }
    }
  }
  switch (uploadResponse.messageKey) {
    case 'DID_MIGRATE':
      return getMigrationMessage({
        migrationsRan: uploadResponse.migrationsRan,
        t,
      })
    default: {
      assert(
        false,
        `invalid messageKey ${uploadResponse.messageKey} specified for modal`
      )
      // @ts-expect-error (ce, 2021-06-23) the case below will never happened, as we've already narrowed all posibilities
      return { title: '', body: uploadResponse.messageKey }
    }
  }
}
