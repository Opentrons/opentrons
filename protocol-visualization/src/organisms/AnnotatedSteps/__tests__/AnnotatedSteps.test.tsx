import { describe, it } from 'vitest'

// Test todo's. To be completed in a later PR.
// Mock AnnotatedStepsRowItem to keep tests focused on row-building logic

describe('AnnotatedSteps', () => {
  describe('flat (ungrouped) mode — groupedCommands is null', () => {
    it.todo('renders a command row for each non-load, non-home command')

    it.todo('filters out commands whose commandType includes "load"')

    it.todo('filters out commands with commandType "home"')

    it.todo('numbers commands starting from 1')
  })

  describe('grouped mode — groupedCommands is provided', () => {
    it.todo('renders a group row for each ParentNode in groupedCommands')

    it.todo('renders a command row for each LeafNode in groupedCommands')

    it.todo(
      'marks a leaf as highlighted when currentCommandIndex matches its index in the full command list'
    )

    it.todo(
      'marks a group as highlighted when any of its subCommands is highlighted'
    )
  })

  describe('error handling', () => {
    it.todo('appends an error row when analysis.errors is non-empty')

    it.todo('does not append an error row when analysis.errors is empty')

    it.todo('shows ProtocolAnalysisErrorModal when the error row is clicked')

    it.todo('closes ProtocolAnalysisErrorModal when onClose is called')
  })

  describe('scroll behaviour', () => {
    it.todo(
      'sets scrollTargetId to the highlighted command id when currentCommandIndex changes in flat mode'
    )

    it.todo(
      'sets scrollTargetId to the highlighted command id when currentCommandIndex changes in grouped mode'
    )
  })

  describe('bottom detection', () => {
    it.todo(
      'calls setIsAtBottom(true) when the last row is rendered and rows is non-empty'
    )

    it.todo('calls setIsAtBottom(true) when rows is empty')
  })
})
