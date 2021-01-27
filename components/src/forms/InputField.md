```js
const [state, setState] = React.useState({ inputValue: '' })

function handleChange(e) {
  setState({ inputValue: e.target.value })
}

function getError(state) {
  return state.inputValue.length > 12 ? 'Too many characters' : undefined
}

;<InputField
  label="Input field"
  placeholder="Placeholder Text"
  onChange={handleChange}
  value={state.inputValue}
  units="μL"
  caption="caption here"
  secondaryCaption={state.inputValue.length + '/12'}
  error={getError(state)}
/>
```

Without units

```js
const [state, setState] = React.useState({ inputValue: null })

function handleChange(e) {
  setState({ inputValue: e.target.value })
}

;<InputField
  label="Input field"
  placeholder="Placeholder Text"
  onChange={handleChange}
  value={state.inputValue}
/>
```

No label

```js
const [state, setState] = React.useState({ inputValue: null })

function handleChange(e) {
  setState({ inputValue: e.target.value })
}

;<InputField
  placeholder="Placeholder Text"
  onChange={handleChange}
  value={state.inputValue}
  units="Times"
/>
```

Optional isIndeterminate prop and placeholder/value override when true

```js
const [state, setState] = React.useState({
  inputValue: 'mixed values',
  isIndeterminate: true,
})

function handleChange(e) {
  setState({ inputValue: e.target.value, isIndetermiante: false })
}

;<InputField
  placeholder="Placeholder Text"
  onChange={handleChange}
  value={state.inputValue}
  units="Times"
  isIndeterminate={state.isIndeterminate}
/>
```
