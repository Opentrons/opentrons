```js
initialState = {inputValue: null}

function handleChange (e) {
  setState({inputValue: e.target.value})
}

;<InputField
  label='Input field'
  placeholder='Placeholder Text'
  onChange={handleChange}
  value={state.inputValue}
  units='μL'
/>
```

Without units

```js
initialState = {inputValue: null}

function handleChange (e) {
  setState({inputValue: e.target.value})
}

;<InputField
  label='Input field'
  placeholder='Placeholder Text'
  onChange={handleChange}
  value={state.inputValue}
/>
```

No label

```js
initialState = {inputValue: null}

function handleChange (e) {
  setState({inputValue: e.target.value})
}

;<InputField
  placeholder='Placeholder Text'
  onChange={handleChange}
  value={state.inputValue}
  units='Times'
/>
```
