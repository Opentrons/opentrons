export interface StepThunk {
  call: () => void
}

// todo(mm, 2025-09-09): This indirection is not currently doing anything for us.
// Replace `stepExecutor.execute(Foo())` with just `foo()`?
export class StepExecutor {
  execute(step: StepThunk): this {
    step.call()
    return this
  }
}
