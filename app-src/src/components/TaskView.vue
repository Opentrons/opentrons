<template>
  
    <section id="task-view">
      <section id="placeable-pane">  
        <h1 :class="{calibrated : instrument().calibrated,  active: $route.params.placeable }">{{$route.params.placeable}} at slot {{$route.params.slot}}
        <span class="more-info">
        <a role="button" id="show-modal" @click="showModal = true">?</a>
        </span>
        </h1> 
        <!-- placeable modal -->
        <modal v-if="showModalPlaceable" @close="showModalPlaceable = false" :placeable="placeable($route.params.slot)" :instrument="instrument()">
        </modal>

        <deck-navigation  :instrument='instrument()' :deck='deck()'></deck-navigation>  
      </section>

      <section id="instrument-pane">
        <h1>{{instrument().label}} {{channels}} [{{instrumentLocation}}]</h1>
        <!-- TODO: Refactor into PipetteNavigation Component w/props -->
        <button  v-for="instrument in tasks().instruments" 
        class="tab" :class="{active : activePipette(instrument)}"  
        @click="togglePipette(instrument.axis)"> 
        {{instrument.axis}} {{instrument.label}}<span v-for="c in instrument.channels">&#9661;</span></button>

        <div class="pipette-modal" :class="plungerMode">
        <div class="plunger-nav">
          <ul>
            <li @click="modePlunger('top')" class="top">Top</li>
            <li @click="modePlunger('bottom')" class="bottom">Bottom</li>
            <li @click="modePlunger('blowout')" class="blowout">Blowout</li>
            <li @click="modePlunger('drop_tip')" class="droptip">Drop Tip</li>
          </ul>
        </div>
        <div class="plunger-img">
          <img src='../assets/img/pipette_top.png' class='top'/>
          <img src='../assets/img/pipette_bottom.png' class='bottom'/>
          <img src='../assets/img/pipette_blowout.png' class='blowout'/>
          <img src='../assets/img/pipette_drop_tip.png' class='drop_tip'/>
        </div>
        </div>
        <!-- TODO: Move to Separate Component and wire up -->
        <button @click="calibrateInstrument(currentAxis(), 'drop_tip')" class='btn-calibrate save'>SAVE</button>
        <button @click="moveToPlungerPosition(currentAxis(), 'drop_tip')" class="btn-calibrate move-to">MOVE TO</button>
        </section>

      </section>

    </section>

  <!-- TODO: Move run screen logic to runlog panel at bottom of app -->
  <!--   <RunScreen class='run-screen' v-show='running()'></RunScreen> -->
</template>

<script>
  // import RunScreen from './RunScreen.vue'
  import DeckNavigation from './DeckNavigation'
  import Modal from './Modal.vue'

  export default {
    props: ['busy'],
    data () {
      return {
        axis: this.$route.params.instrument,
        plungerMode: 'mode-top',
        plungerPos: 'top',
        showModalPlaceable: false
      }
    },
    components: {
      DeckNavigation,
      Modal
    },
    computed: {
      channels () {
        return this.instrument().channels === 1 ? 'single' : 'multi'
      },
      instrumentLocation () {
        return this.instrument().axis === 'a' ? 'right' : 'left'
      }
    },
    methods: {
      placeable (slot) {
        let container = this.deck().find(element => element.slot === slot)
        return container
      },
      params () {
        return this.$route.params
      },
      tasks () {
        return this.$store.state.tasks
      },
      deck () {
        return this.$store.state.tasks.deck
      },
      instrument () {
        let instrument = this.$store.state.tasks.instruments.find(element => element.axis === this.axis)
        return instrument
      },
      activePipette (instrument) {
        return instrument.axis === this.axis
      },
      togglePipette (axis) {
        this.$router.push({ name: 'instrument', params: { instrument: axis, slot: null, placeable: null } })
      },
      modePlunger (mode) {
        this.plungerMode = 'mode-' + mode
        this.plungerPos = mode
      },
      calibrateInstrument (position) {
        let axis = this.axis
        this.$store.dispatch('calibrate', {axis, position})
      },
      moveToPlungerPosition (position) {
        let axis = this.axis
        this.$store.dispatch('moveToPosition', {axis, position})
      },
      running () {
        return this.$store.state.running || this.$store.state.protocolFinished
      }
    },
    watch: {
      '$route' (to, from) {
        this.axis = to.params.instrument
      }
    }
  }
</script>