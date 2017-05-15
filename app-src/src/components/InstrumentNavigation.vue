<template>
  <div>
  <!-- Instrument Toggle / Nav -->
  <!-- TODO: better active button state style, multi/single icon -->
  <div class="pipette-btns">
  <button  v-for="instrument in tasks().instruments" 
  :id="instrument.axis"
  class="tab" :class="{active : instrument.axis === axis}"  
  @click="togglePipette(instrument.axis)"> 
  {{instrument.axis}} {{instrument.label}}<span v-for="c in instrument.channels">&#9661;</span></button>
  </div>

  <div class="pipette-modal" :class="plungerMode">
    <div class="plunger-nav">
      <ul>
        <li @click="modePlunger(instrument.axis, 'top')" class="top" :class="{calibrated: isCalibrated('top')}">Top </li>
        <li @click="modePlunger(instrument.axis, 'bottom')" class="bottom" :class="{calibrated: isCalibrated('bottom')}">Bottom</li>
        <li @click="modePlunger(instrument.axis, 'blow_out')" class="blow_out" :class="{calibrated: isCalibrated('blow_out')}">Blowout</li>
        <li @click="modePlunger(instrument.axis, 'drop_tip')" class="drop_tip" :class="{calibrated: isCalibrated('dorp_tip')}">Drop Tip</li>
      </ul>
    </div>
    <div class="plunger-img">
      <img src='../assets/img/pipette_top.png' class='top'/>
      <img src='../assets/img/pipette_bottom.png' class='bottom'/>
      <img src='../assets/img/pipette_blow_out.png' class='blow_out'/>
      <img src='../assets/img/pipette_drop_tip.png' class='drop_tip'/>
    </div>
  </div>
  </div>
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
    filters: {
      reverse: function (array) {
        return array.reverse()
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
        this.axis = axis
      },
      modePlunger (axis, mode) {
        this.plungerMode = 'mode-' + mode
        this.$emit('updatePos', mode)
        this.togglePipette(axis)
      },
      isCalibrated (mode) {
        return this.instrument[mode] != null
      }
    }
  }
</script>

<style scoped>
  

</style>