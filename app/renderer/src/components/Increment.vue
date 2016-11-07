<template>
  <section id="increment">
    <div v-for="i in increments" @click="selectIncrement(i)">
      <input type="radio" :id="i" name="increment" :value="i" />
      <label :for="i"><span></span>{{i}}</label>
    </div>
  </section>
</template>

<script>
  export default {
    name: 'Increment',
    props: ['increments', 'placeable'],
    methods: {
      selectIncrement(i) {
        this.$store.dispatch("selectIncrement", {inc: i})
      }
    }
  }
</script>
