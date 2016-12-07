<template>
  <section id='increment-plunger'>
  <h3 class='title plunger'>[mm]</h3>
    <div v-for='i in increments' @click='selectIncrement(i)' >
      <input type='radio' :id="i+'p'" name='incrementPlunger' :value='i' :checked='active(i)' />
      <label :for='i'>{{i}}<br><span></span></label>
    </div>
  </section>
</template>

<script>
  export default {
    name: 'Increment',
    props: ['increments'],
    methods: {
      selectIncrement (i) {
        this.$store.dispatch('selectIncrementPlunger', {inc: i})
      },
      active (i) {
        return this.$store.state.currentIncrementPlunger === i
      }
    }
  }
</script>
