Basic usage:

```js
<div style={{width: '16rem'}}>
  <PrimaryButton onClick={() => alert('you clicked me')}>
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
