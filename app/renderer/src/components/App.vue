<template>
  <div>
    <toast position="n"></toast>
    <header id="home-connect">
        <Home></Home>
        <div class="logo">
          <img src="assets/img/logo_rgb_transparent.png" />
        </div>
        <nav class="connect">
          <Connect></Connect>
        </nav>
    </header>
    <section id="protocol">
        <!-- <form ref="form" @submit="uploadProtocol" action="http://127.0.0.1:5000/upload" method="POST" enctype="multipart/form-data" :class="['step-upload', classObject]"> -->
        <form class="upload">
            <div class="fileUpload">
                <span>Click or Drag to Upload</span>
                <input ref="input" type="file" name="file" class="upload" />
            </div>
        </form>
    </section>
    <main id="container">
      <Jog></Jog>
        <section id="task-pane">
            <aside id="step-list">
                <div class="instrument">
                    <h3 class="title">p200</h3>
                    <ul>
                        <li><a class="completed">[A1] tiprack200</a></li>
                        <!-- router link active class automatically applied
                by router, this is just for demo purposed here -->
                        <li><a class="router-link-active">[B2] trash</a></li>
                        <li><a>[C1] plate</a></li>
                        <li><a>[C2] tuberack</a></li>
                        <li><a>Pipette</a></li>
                    </ul>
                </div>
                <div class="instrument">
                    <h3 class="title">p10</h3>
                    <ul>
                        <li><a>[A1] tiprack10</a></li>
                        <li><a>[B2] trash</a></li>
                        <li><a>[C1] plate</a></li>
                        <li><a>[C2] tuberack</a></li>
                        <li><a>Pipette</a></li>
                    </ul>
                </div>
            </aside>
            <section id="task">
                <h1 class="title">Calibrate the p10 pipette to the center of your trash container</h1>
                <button class="btn-calibrate save">SAVE</button>
                <button class="btn-calibrate move-to">MOVE TO</button>
                 <button class="btn-calibrate move-to">PICK UP TIP</button>
                  <button class="btn-calibrate move-to">DROP TIP</button>
            </section>
        </section>
    </main>
  <div>
</template>


<script>
  import Connect from './Connect.vue'
  import Home from './Home.vue'
  import Jog from './Jog.vue'
  import { Toast } from 'vuex-toast'

  export default {
    components: {
      Toast,
      Connect,
      Home,
      Jog
    }
  }
</script>

<style lang="sass">
  @import "../assets/sass/new.scss";
  @import "../../../../node_modules/vuex-toast/dist/vuex-toast.css";
</style>
