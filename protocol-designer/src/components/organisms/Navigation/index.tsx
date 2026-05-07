import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

import { BasicButton, COLORS, StyledText } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { ACCEPTED_PROTOCOL_FILE_TYPES } from '/protocol-designer/constants'
import {
  getFileMetadata,
  getRobotType,
} from '/protocol-designer/file-data/selectors'
import { actions as loadFileActions } from '/protocol-designer/load-file'
import { getHasUnsavedChanges } from '/protocol-designer/load-file/selectors'
import { toggleNewProtocolModal } from '/protocol-designer/navigation/actions'
import { getFlexDesignerCreateUrl } from '/protocol-designer/utils/getFlexDesignerCreateUrl'

import { FlexProtocolModal } from '../FlexProtocolModal'
import { SettingsIcon } from '../SettingsIcon'
import styles from './navigation.module.css'

import type { ChangeEvent } from 'react'
import type { ThunkDispatch } from '/protocol-designer/types'

export function Navigation(): JSX.Element | null {
  const { t } = useTranslation(['shared', 'alert'])
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch: ThunkDispatch<any> = useDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingNav = useRef(false)
  const metadata = useSelector(getFileMetadata)
  const robotType = useSelector(getRobotType)
  const [showFlexModal, setShowFlexModal] = useState<boolean>(false)
  const loadFile = (fileChangeEvent: ChangeEvent<HTMLInputElement>): void => {
    dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
    dispatch(toggleNewProtocolModal(false))
    if (location.pathname !== '/') {
      pendingNav.current = true
    }
  }
  const hasUnsavedChanges = useSelector(getHasUnsavedChanges)

  useEffect(() => {
    if (pendingNav.current && metadata?.created != null) {
      pendingNav.current = false
      if (robotType === FLEX_ROBOT_TYPE) {
        dispatch(loadFileActions.undoLoadFile())
        setShowFlexModal(true)
      } else {
        navigate('/overview')
      }
    }
  }, [metadata, navigate, robotType, dispatch])

  const handleCreateNew = (): void => {
    if (
      !hasUnsavedChanges ||
      window.confirm(t('alert:confirm_create_new') as string)
    ) {
      navigate('/createNew', { state: { modalResetKey: Date.now() } })
    }
  }

  // todo(mm, 2025-10-27): Unlike the "create new" button, the "import" button
  // will not warn you if you're overwriting a protocol with unsaved changes.
  // Should it?
  const handleImport = (): void => {
    if (fileInputRef.current != null) {
      fileInputRef.current.click()
    }
  }

  const openFlexDesignerInNewTab = (): void => {
    const redirectTarget = getFlexDesignerCreateUrl()
    window.open(redirectTarget, '_blank', 'noopener')
  }

  const handleOpenFlexDesigner = (): void => {
    openFlexDesignerInNewTab()
    setShowFlexModal(false)
  }

  return (
    <>
      {showFlexModal ? (
        <FlexProtocolModal
          onClose={() => {
            setShowFlexModal(false)
          }}
          onOpenFlexDesigner={handleOpenFlexDesigner}
        />
      ) : null}
      <nav>
        <div className={styles.nav_container}>
          <div className={styles.nav_title_container}>
            <StyledText desktopStyle="bodyLargeSemiBold">{t('ot2')}</StyledText>
            <StyledText
              desktopStyle="bodyLargeSemiBold"
              color={COLORS.purple50}
            >
              {t('protocol_designer')}
            </StyledText>
          </div>
          <div className={styles.nav_button_container}>
            <BasicButton onClick={handleCreateNew}>
              {t('create_new')}
            </BasicButton>
            <label className={styles.import_label}>
              <BasicButton onClick={handleImport}>{t('import')}</BasicButton>
              <input
                className={styles.hidden_input}
                type="file"
                onChange={loadFile}
                aria-label={`${t('import')}_from_navigation`}
                ref={fileInputRef}
                accept={ACCEPTED_PROTOCOL_FILE_TYPES}
              />
            </label>
            {location.pathname === '/createNew' ? null : <SettingsIcon />}
          </div>
        </div>
      </nav>
    </>
  )
}
