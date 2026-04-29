# Code Review check list for Frontend

## TypeScript

### type safe

- Check the changes do not use any.
- Use the strict check if type isn't optional

```ts
const myConst: string | null = getValue()

// good
if (myConst !== null) return myConst

// bad
if (myConst != null) return myConst
```

## Opentrons UI components

## Reactjs

- use React doctor to check the changes

```shell
npx -y react-doctor@latest . --verbose
```

If there is an error, explain the issue and suggest a solution/solutions
