# Python Step Generation

We want to add Python generation to `step-generation` without severely changing the architecture and rewriting all the code.

## Where does the Python go?

The command creators produce a `CommandCreatorResult`. We'll augment that to include Python commands:

```typescript
export type CommandCreatorResult =
  CommandsAndWarnings | CommandCreatorErrorResponse

export interface CommandsAndWarnings {
  commands: CreateCommand[]
  warnings?: CommandCreatorWarning[]
  python?: string // <<< NEW
}
```

Here and elsewhere, we make `python` an optional field so that we don't have to rewrite all of our existing code to populate it when creating objects.

The new `python` field contains one or more lines of Python commands. It behaves analogously to the JSON `commands`. When reducing `CurriedCommandCreator`s together, we concatenate their JSON `commands`, so now we will also concatenate their `python` commands too:

```typescript
export const reduceCommandCreators = (...): CommandCreatorResult => {
  const result = commandCreators.reduce(
    (prev: CCReducerAcc, reducerFn: CurriedCommandCreator): CCReducerAcc => {
      const allCommands = [...prev.commands, ...next.commands]
      const allPython = [prev.python, next.python].join('\n')  // <<< NEW
      return {
        commands: allCommands,
        python: allPython,  // <<< NEW
      }
    },
    ...
  )
}
```

## Data flow

The JSON commands from the `CommandCreatorResult`s get propagated to the `Timeline`, which is where we ultimately get the commands from to write out to the exported JSON file. By analogy, we'll add the Python commands to the `Timeline` as well:

```typescript
export interface Timeline {
  timeline: CommandsAndRobotState[]
  errors?: CommandCreatorError[] | null
}

export interface CommandsAndRobotState {
  commands: CreateCommand[]
  robotState: RobotState
  warnings?: CommandCreatorWarning[]
  python?: string // <<< NEW
}
```

## Generating JSON and Python in parallel

In the easy case, one JSON command corresponds to one Python command, and we can just emit them side-by-side, like:

```typescript
export const aspirate: CommandCreator<...> = (args, invariantContext, prevRobotState) => {
  return {
    commands: [ { commandType: 'aspirate', params: {...} } ],
    python: `some_pipette.aspirate(...)`,
  }
}
```

Sometimes, we want to emit a Python command that doesn't correspond to any single JSON command. For example, the command sequence for a Mix step has something like:

```typescript
[
  curryCommandCreator(aspirate, {...}),
  curryCommandCreator(dispense, {...}),
]
```

The Python API has a `mix()` that implements both aspirate and dispense. We can generate it by adding a `CommandCreator` that emits the Python `mix()` command with no JSON command:

```typescript
[
  curryCommandCreator(aspirate, {...}),
  curryCommandCreator(dispense, {...}),
  curryCommandCreator(pythonMix, {...}), // <<< ADD
]

const pythonMix: CommandCreator<...> = (...) => {
  return {
    commands: [],  // emits no JSON
    python: `some_pipette.mix(...)`,
  }
}
```

When the reducer runs, it joins together all the non-empty JSON `commands` to get the final JSON output, and it'll join together all the non-empty `python` commands to get the final Python output.

We need one more tool to make this work: because the Python `mix()` command replaces both the aspirate and dispense, we need to _suppress_ Python generation from aspirate and dispense. We'll do that by introducing a new variant of `curryCommandCreator` that discards the Python we don't want. So the final sequence becomes:

```typescript
[
  curryWithoutPython(aspirate, {...}),
  curryWithoutPython(dispense, {...}),
  curryCommandCreator(pythonMix, {...}),
]
```

Now this sequence works for generating both JSON and Python.
