import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

import { COLORS, StyledText, TYPOGRAPHY } from '@opentrons/components'

import { AttachedFileItem } from '/ai-client/components/atoms/AttachedFileItem'
import { AttachFileButton } from '/ai-client/components/atoms/AttachFileButton'
import { SendButton } from '/ai-client/components/atoms/SendButton'
import { useInputPromptController } from '/ai-client/resources/hooks'
import { calcTextAreaHeight } from '/ai-client/resources/utils'
import { MAX_FILES_PER_MESSAGE } from '/ai-client/resources/utils/fileUtils'

import styles from './inputprompt.module.css'

export function InputPrompt(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const { register, watch, reset, setValue } = useFormContext()
  const watchUserPrompt = (watch('userPrompt') ?? '') as string

  const {
    submitChat,
    isLoading,
    errorMessage,
    attachedFiles,
    handleFileSelect,
    handleRemoveFile,
  } = useInputPromptController({
    userPrompt: watchUserPrompt,
    resetForm: () => {
      reset()
    },
    setUserPrompt: v => {
      setValue('userPrompt', v)
    },
  })

  return (
    <form id="User_Prompt" className={styles.form}>
      {/* Error message */}
      {errorMessage != null && errorMessage !== '' && (
        <div className={styles.error_container}>
          <StyledText
            color={COLORS.red50}
            fontSize={TYPOGRAPHY.fontSizeH3}
            lineHeight={TYPOGRAPHY.lineHeight20}
          >
            {errorMessage}
          </StyledText>
        </div>
      )}

      {/* Main input container */}
      <div className={styles.main_input_container}>
        {/* Display attached files above the input */}
        {attachedFiles.length > 0 && (
          <div className={styles.attached_files_section}>
            <div className={styles.attached_files_list}>
              {attachedFiles.map((file, index) => (
                <AttachedFileItem
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => {
                    handleRemoveFile(index)
                  }}
                  showRemoveButton={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Text input area - separate row */}
        <div
          className={clsx(
            styles.text_input_section,
            attachedFiles.length === 0 && styles.text_input_section_no_files
          )}
        >
          <textarea
            rows={calcTextAreaHeight(watchUserPrompt)}
            placeholder={t('type_your_prompt')}
            className={styles.textarea}
            {...register('userPrompt')}
          />
        </div>

        {/* Bottom row with attach button and send button */}
        <div className={styles.button_row_container}>
          <AttachFileButton
            onFileSelect={handleFileSelect}
            disabled={
              isLoading || attachedFiles.length >= MAX_FILES_PER_MESSAGE
            }
          />
          <div className={styles.spacer} />
          <SendButton
            disabled={watchUserPrompt.length === 0}
            isLoading={isLoading}
            handleClick={submitChat}
          />
        </div>
      </div>
    </form>
  )
}
