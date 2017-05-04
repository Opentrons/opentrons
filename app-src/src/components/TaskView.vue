<template>
  
    <section id="task-view">
      <section id="placeable-pane">  
        <!-- Placeable Info -->
        <h1 :class="{calibrated : instrument().calibrated,  active: $route.params.placeable }">{{$route.params.placeable}} at slot {{$route.params.slot}}
          <span class="more-info">
          <a role="button" id="show-modal" @click="showModal = true">?</a>
          </span>
        </h1> 

        <!-- Placeable Modal -->
        <modal v-if="showModalPlaceable" @close="showModalPlaceable = false" :placeable="placeable($route.params.slot)" :instrument="instrument()">
        </modal>

        <!-- Placeable Nav / Deck Map -->
        <deck-navigation  :instrument='instrument()' :deck='deck()'></deck-navigation>
        
        <!-- Placeable Calibration -->
        <placeable-calibration v-if="$route.params.placeable" :instrument='instrument()' :deck='deck()'></placeable-calibration>
      </section>

      <section id="instrument-pane">
        <!-- Instrument Info -->
        <h1>{{instrument().label}} {{channels}} [{{instrumentLocation}}]</h1>
        <!-- Instrument Toggle / Nav -->
        <button  v-for="instrument in tasks().instruments" 
        class="tab" :class="{active : activePipette(instrument)}"  
        @click="togglePipette(instrument.axis)"> 
        {{instrument.axis}} {{instrument.label}}<span v-for="c in instrument.channels">&#9661;</span></button>

        <div class="pipette-modal" :class="plungerMode">
          <div class="plunger-nav">
            <ul>
              <li @click="modePlunger(instrument().axis, 'top')" class="top">Top</li>
              <li @click="modePlunger(instrument().axis, 'bottom')" class="bottom">Bottom</li>
              <li @click="modePlunger(instrument().axis, 'blowout')" class="blowout">Blowout</li>
              <li @click="modePlunger(instrument().axis, 'drop_tip')" class="droptip">Drop Tip</li>
            </ul>
          </div>
          <div class="plunger-img">
            <img src='../assets/img/pipette_top.png' class='top'/>
            <img src='../assets/img/pipette_bottom.png' class='bottom'/>
            <img src='../assets/img/pipette_blowout.png' class='blowout'/>
            <img src='../assets/img/pipette_drop_tip.png' class='drop_tip'/>
          </div>
        </div>
        <!--- Instrument Calibration -->
        <!-- v-if="!$route.params.placeable" -->
        <instrument-calibration :instrument="instrument()" :position="plungerPos"></instrument-calibration>

        </section>
      </section>

    </section>

  <!-- TODO: Move run screen logic to runlog panel at bottom of app -->
  <!--   <RunScreen class='run-screen' v-show='running()'></RunScreen> -->
</template>

<script>
  // import RunScreen from './RunScreen.vue'
  import PlaceableCalibration from './PlaceableCalibration'
  import DeckNavigation from './DeckNavigation'
  import Modal from './Modal.vue'
  import InstrumentCalibration from './InstrumentCalibration'

  export default {
    name: 'TaskView',
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
      PlaceableCalibration,
      Modal,
      InstrumentCalibration
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
      modePlunger (axis, mode) {
        this.plungerMode = 'mode-' + mode
        this.plungerPos = mode
        this.togglePipette(axis)
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