<template>
    <body>
    <!--ref to here -->
        <div class="waitingModal" v-if="showWaiting">
            <div class="waiting-content">
              <h5>Waiting modal</h5>
              <h5></h5>
              <p>Latitude: {{this.driverLocation["driverLat"]}}</p>
              <p>Longitude: {{this.driverLocation["driverLng"]}}</p>
              <slot></slot>
              <button @click="closeWaitingModal">Close</button>
            </div>
        </div>
    </body>
</template>

<script>
export default{
    name: "waiting-view",
    data(){
        return {
            showWaiting: false,
            driverLocation:''
        }
    },
    methods:{
        openWaitingModal(mapObject){

            console.log("clicked")
            this.showWaiting = true;
            let new_driver_location = mapObject;
            console.log("new driver location: ", JSON.stringify(new_driver_location))
            this.driverLocation = new_driver_location
        },
        closeWaitingModal(){
            this.showWaiting = false;
        }
    },
    mounted(){

    }
}
</script>

<style>
.waitingModal {
    position: absolute;
    top: 500px;
    left: 300px;
    margin: 0 200px;
    background-color: antiquewhite;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width:600px;
    height: 300px;
    margin: 0 auto;
    z-index: 5;
}

.waiting-content {
  padding: 20px;
  text-align: center;

}
</style>