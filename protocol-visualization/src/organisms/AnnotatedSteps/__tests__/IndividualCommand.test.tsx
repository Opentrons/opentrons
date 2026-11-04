import { describe, it } from 'vitest'

// Test todo's. To be completed in a later PR.

describe('IndividualCommand', () => {
  it.todo('renders CommandText output for the given command')

  it.todo('calls setSelectedCommand with command.id when the row is clicked')

  it.todo('applies the highlighted CSS class when isHighlighted is true')

  it.todo(
    'does not apply the highlighted CSS class when isHighlighted is false'
  )

  it.todo(
    'applies rogue_individual_command_container class when fromGroup is true'
  )

  it.todo(
    'does not apply rogue_individual_command_container class when fromGroup is false'
  )

  it.todo(
    'scrolls the command into view when command.id matches scrollTargetId and isHighlighted is true'
  )

  it.todo('does not scroll when command.id does not match scrollTargetId')

  it.todo('renders without error when setSelectedCommand is not provided')
})
