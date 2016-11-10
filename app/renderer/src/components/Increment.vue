<template>
  <section id="increment-xyz">
    <div v-for="i in increments" @click="selectIncrement(i)" >
      <input type="radio" :id="i" name="increment" :value="i" :checked="active(i)" />
      <label :for="i"><span></span>{{i}}</label>
    </div>
    <div class="slot" v-for="(value, key) in slots" @click="selectIncrement(key)" >
      <input type="radio" :id="key" name="increment" :value="key" :checked="active(key)" />
      <label :for="key"><span></span><br>{{value}}</label>
    </div>
  </section>
</template>

<script>
  export default {
    name: 'Increment',
    props: ['increments', 'placeable'],
    data: function(){
      return{
        slots:{
          91: "Slot X",
          135: "Slot Y"
        }
      }
    },
    methods: {
      selectIncrement(i) {
        this.$store.dispatch("selectIncrement", {inc: i})
      },
      active(i) {
        return this.$store.state.current_increment_placeable === i     
      }    
    }
  }
</script>
