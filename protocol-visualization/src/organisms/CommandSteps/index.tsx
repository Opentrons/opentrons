import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS, InputField, StyledText } from '@opentrons/components'

import { AnnotatedSteps } from '../AnnotatedSteps'
import styles from './commandsteps.module.css'

import type {
  ChangeEvent,
  Dispatch,
  KeyboardEvent,
  ReactNode,
  SetStateAction,
} from 'react'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { GroupedCommands } from '../../types'

interface CommandStepsProps {
  groupedCommands: GroupedCommands | null
  analysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
  setSelectedCommand: Dispatch<SetStateAction<string | null>>
  percentComplete: number
  handlePause: () => void
  currentCommandIndex?: number
  milliSecondsPerFrame: number
  isGlobalPlaying: boolean
}

export function CommandSteps(props: CommandStepsProps): ReactNode {
  const {
    groupedCommands,
    analysis,
    setSelectedCommand,
    percentComplete,
    handlePause,
    currentCommandIndex,
    milliSecondsPerFrame,
    isGlobalPlaying,
  } = props
  const { t } = useTranslation('protocol_visualization')
  const [isAtBottom, setIsAtBottom] = useState<boolean>(false)

  // 親コンポーネントと同じフィルタリングルールを適用
  const filteredCommands = analysis.commands.filter(
    command =>
      !command.commandType.includes('load') && command.commandType !== 'home'
  )

  // 全体件数も filteredCommands の長さに合わせます
  const totalCommandsLength = filteredCommands.length

  // 入力中のステップ番号（1-based）
  const [inputValue, setInputValue] = useState<string>(
    currentCommandIndex != null ? String(currentCommandIndex + 1) : ''
  )

  // 外部からの currentCommandIndex の変更を入力欄へ自動反映
  useEffect(() => {
    if (currentCommandIndex != null) {
      setInputValue(String(currentCommandIndex + 1))
    } else {
      setInputValue('')
    }
  }, [currentCommandIndex])

  // 指定されたステップ（1-based）をアクティブにする処理
  const jumpToStep = (stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= totalCommandsLength) {
      // analysis.commands ではなく filteredCommands から参照します
      const targetCommand = filteredCommands[stepNumber - 1]
      if (targetCommand?.id != null) {
        setSelectedCommand(targetCommand.id)
      }
    } else {
      // 範囲外の値が入力された場合は現在のステップに戻す
      setInputValue(
        currentCommandIndex != null ? String(currentCommandIndex + 1) : ''
      )
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  // Enter キー押下時にジャンプ
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(inputValue, 10)
      if (!isNaN(parsed)) {
        jumpToStep(parsed)
      }
    }
  }

  // フォーカスが外れた時にジャンプ
  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed)) {
      jumpToStep(parsed)
    } else {
      setInputValue(
        currentCommandIndex != null ? String(currentCommandIndex + 1) : ''
      )
    }
  }

  return (
    <div className={styles.detail_container}>
      <div className={styles.command_step}>
        <div className={styles.command_step_header}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('protocol_steps')}
          </StyledText>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
              Step:
            </StyledText>
            <InputField
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              aria-label="Step Index Search"
            />
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
              {`/${totalCommandsLength}`}
            </StyledText>
          </div>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('percent_complete', { percent: percentComplete.toFixed(0) })}
          </StyledText>
        </div>
        <div
          className={`${styles.command_step_groups} ${isAtBottom ? styles.at_bottom : ''}`}
        >
          <AnnotatedSteps
            currentCommandIndex={currentCommandIndex}
            analysis={analysis}
            groupedCommands={groupedCommands}
            setSelectedCommand={setSelectedCommand}
            handlePause={handlePause}
            setIsAtBottom={setIsAtBottom}
            milliSecondsPerFrame={milliSecondsPerFrame}
            isGlobalPlaying={isGlobalPlaying}
          />
        </div>
      </div>
    </div>
  )
}
