Basic usage:

```js
<div style={{width: '16rem'}}>
  <PrimaryButton onClick={() => alert('you clicked me')}>
    {'Click for alert'}
  </PrimaryButton>
</div>
```
```js
<div style={{width: '16rem'}}>
  <PrimaryButton onClick={() => alert('you clicked me')} inverted>
    {'Click for alert'}
  </PrimaryButton>
</div>
```

Disabled:

```js
<div style={{width: '16rem'}}>
  <PrimaryButton onClick={() => alert("can't click me")} disabled>
    {"Can't click"}
  </PrimaryButton>
</div>
```

With icon:

```js
<div style={{width: '16rem'}}>
  <PrimaryButton onClick={() => alert('you clicked me')} iconName='flask-outline'>
    {'Click for alert'}
  </PrimaryButton>
</div>
```

Sometimes you need `<PrimaryButton>` that isn't a native `<button>`. To do this, pass a string or React component to the `Component` prop. If you pass `Component`, any extra props will get passed to your custom component.

Use the inspector on this example to see that the "button" is a `<div>` with the `role` attribute set.

```js
<div style={{width: '16rem'}}>
  <PrimaryButton
    Component='div'
    role='button'
    iconName='flask-outline'
    onClick={() => alert('click!')}
  >
    {"I'm a div!"}
  </PrimaryButton>
</div>
```
