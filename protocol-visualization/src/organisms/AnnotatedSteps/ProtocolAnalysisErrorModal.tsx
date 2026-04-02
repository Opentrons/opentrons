import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { COLORS, Icon, Modal, PrimaryButton, StyledText } from '@opentrons/components'
import type { AnalysisError } from '@opentrons/shared-data'

interface ProtocolAnalysisErrorModalProps {
    errors: AnalysisError[]
    onClose: () => void
    portalRoot?: HTMLElement | null
}

export function ProtocolAnalysisErrorModal({
                                               errors,
                                               onClose,
                                               portalRoot,
                                           }: ProtocolAnalysisErrorModalProps): JSX.Element {
    const { t } = useTranslation('protocol_visualization')
    return createPortal(
        <Modal
            title={t('protocol_analysis_failure')}
            onClose={onClose}
            footer={<PrimaryButton onClick={onClose}>{t('close')}</PrimaryButton>}
        >
            {errors.map(error => (
                <StyledText key={error.id} desktopStyle="bodyDefaultRegular">
                    {error.detail}
                </StyledText>
            ))}
        </Modal>,
        portalRoot ?? document.body
    )
}