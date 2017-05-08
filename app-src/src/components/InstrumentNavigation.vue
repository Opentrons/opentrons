<template>
  <span>
  <!-- Instrument Toggle / Nav -->
  <!-- TODO: better active button state style, multi/single icon -->
  <button  v-for="instrument in tasks().instruments" 
  class="tab" :class="{active : activePipette(instrument)}"  
  @click="togglePipette(instrument.axis)"> 
  {{instrument.axis}} {{instrument.label}}<span v-for="c in instrument.channels">&#9661;</span></button>

  <div class="pipette-modal" :class="plungerMode">
    <div class="plunger-nav">
      <ul>
        <li @click="modePlunger(instrument.axis, 'top')" class="top">Top</li>
        <li @click="modePlunger(instrument.axis, 'bottom')" class="bottom">Bottom</li>
        <li @click="modePlunger(instrument.axis, 'blowout')" class="blowout">Blowout</li>
        <li @click="modePlunger(instrument.axis, 'drop_tip')" class="drop_tip">Drop Tip</li>
      </ul>
    </div>
    <div class="plunger-img">
      <img src='../assets/img/pipette_top.png' class='top'/>
      <img src='../assets/img/pipette_bottom.png' class='bottom'/>
      <img src='../assets/img/pipette_blowout.png' class='blowout'/>
      <img src='../assets/img/pipette_drop_tip.png' class='drop_tip'/>
    </div>
  </div>
  </span>
</template>

<script>
  export default {
    name: 'InstrumentNavigation',
    props: ['instrument'],
    data () {
      return {
        plungerMode: 'mode-top',
        axis: this.$route.params.instrument
      }
    },
    methods: {
      tasks () {
        return this.$store.state.tasks
      },
      activePipette (instrument) {
        return instrument.axis === this.axis
      },
      togglePipette (axis) {
        this.$router.push({ name: 'instrument', params: { instrument: axis, slot: null, placeable: null } })
      },
      modePlunger (axis, mode) {
        this.plungerMode = 'mode-' + mode
        console.log(mode)
        this.$emit('update:plungerPos', mode)
        // this.plungerPos = mode
        this.togglePipette(axis)
      }
    }
  }
</script>