

<script>
import axios from 'axios'
import GMap from './Gmap.vue'
import {v4} from 'uuid';
  import {
    EMQX_IP,
      MQTT_OPTIONS
  } from '/utils/mqtt_config.js'
  import * as mqtt from 'mqtt/dist/mqtt.min';


var client;
  export default {
    name: "rides-view",
    data() {
      return {
        // client & driver
        identity: localStorage.getItem("identity"),
        channel: localStorage.getItem("channel"),
        longitude: 1,
        latitude: 2,
        rid: 15,

        // client
        client_ride_data: [{
          uid: "",
          pickUpLong: localStorage.getItem('pickup_longitude'),
          pickUpLat: localStorage.getItem('pickup_latitude'),
          pickUpResolvedAddress: localStorage.getItem('pickup_address'),
          destResolvedAddress: localStorage.getItem('arrival_address'),
          rideType: "",
          province: "",
          city: ""
        }],
        // driver
        driver_accept_rid: 19,
        subscriptions: [],
        driver_accepting_form: [{
          driverId: "",
          latitude: "",
          longitude: "",
          licensePlateNumber: "",
          vehicleInfo: ""

        }],
        topic: '',

        // Gmap Component
        coordinateX: '',
        coordinateY: '',
        form_type: ''
      }
    },
    computed: {
      get_subscriptions() {
        return `/api/v1/ride/subscriptions?topic=${this.channel}`
      },
      get_rides_url() {
        return `/api/v1/ride/${this.rid}`;
      },
      driver_get_ride_sessions() {
        return `/api/v1/ride/${this.driver_accept_rid}`
      }
    },
    components: {
      GMap
    },
    methods: {
      driver_listening_on_channel() {
        console.log("this.channel: ", this.channel);

        axios.get(this.get_subscriptions)
            .then(response => {
              console.log("get subscriptions: ", response.data);
            }).catch(error => {
          console.log("error", error)
        });

      },
      driver_accept_ride() {
        console.log('driver_id', this.driver_accepting_form[0].driverId);
        axios.put(this.driver_get_ride_sessions,
            this.driver_accepting_form[0]
        ).then(response => {
          console.log('driver accept created session');
          console.log("data: ", response.data);
          console.log("status: ", response.data.status);

          const channel = response.data.data.channel;
          console.log("channel: ", channel);
          // this.driver_accepted(channel);
        })
      },
      sendMessage(message) {
        console.log('sendMessage: message: ', message);
        client.publish(this.channel, message);
      },
      receiveMessage(topic){
        console.log(`receiveMessage: topic = ${topic}`);
        client.on("message", function(topic, message) {

          console.log(`message = ${message.toString()}`);
        });
      },
      clientRequestRide(){
        MQTT_OPTIONS.clientId = v4()
        this.connectToMqtt();

      },

      connectToMqtt() {

        MQTT_OPTIONS.clientId = v4()
        var that = this
        // #ifdef H5
        client = mqtt.connect('ws://' + EMQX_IP, MQTT_OPTIONS)
        // #endif

        client.on('connect', function() {
          console.log('连接成功')
          client.subscribe(that.topic, function(err) {
            if (!err) {
              console.log('订阅成功');
              console.log('sendMessage: message: ', `client message: ${MQTT_OPTIONS.clientId}`);
              client.publish(that.topic, `client message: ${MQTT_OPTIONS.clientId}`);
              console.log(`receiveMessage: topic = ${that.topic}`);

              client.on("message", function(topic, message) {

                console.log(`message = ${message.toString()}`);
              });

              client.on('connect', function(){
                console.log("sent and connected");

              });

            }
          })
        }).on('reconnect', function(error) {
          console.log('正在重连...', that.topic, error)
        }).on('error', function(error) {
          console.log('连接失败...', error)
        }).on('end', function() {
          console.log('连接断开')
        }).on('message', function(topic, message) {
          console.log('接收推送信息：', message.toString())
        })

      },
      getRide() {
        const passenger_coordinates = {
          longitude: this.longitude,
          latitude: this.latitude
        };
        console.log('get_rides');
        console.log('get_rides_url: ', this.get_rides_url);
        axios.post(this.get_rides_url, passenger_coordinates)
            .then(response => {
              console.log(response);
              console.log(response.data);
            })
            .catch(error => {
              console.error(error);
            })
      },
      reposition() {
        setInterval(this.navigation(), 60000) // 1 min

      },
      navigation() {
        // navigator.geolocation.getCurrentPosition((position) => {
        //   console.log(position.coords.latitude, position.coords.longitude);
        //   this.showPosition(position)
        // });


      },
      showPosition(position) {
        const x = document.getElementById("position");
        console.log("position is", x);
        x.innerHTML = "<br>Latitude: " + position.coords.latitude +
            "<br><br>Longitude: " + position.coords.longitude;
        this.getPosition();
      },
      getPosition() {
        const position = document.getElementById("position").innerHTML;
        console.log("position of html is ", position);
      }

    },
    mounted() {
      console.log("identity: ", this.identity)
      console.log("driver's subscriptions: ", this.subscriptions)
      this.navigation();
      console.log('pickup longitude: ',localStorage.getItem('pickup_longitude'));
      console.log('arrive address: ',localStorage.getItem('arrival_address'));
    }
  }
</script>

<template>

  <body>
  <div class="map_ride_container">

    <GMap/>
    <div class="container" v-if="this.identity=='passenger'">
      <div class="client-form-container" v-if="this.identity=='passenger'">
        <form @submit.prevent="clientRequestRide">
          <div class="form-group">
            <label for="uid" class="form-label">uid</label>
            <input v-model="this.client_ride_data[0].uid" type="text" id="uid" class="form-input">
          </div>
          <div class="form-group">
            <label for="pickupLong" class="form-label">pickup-longitude</label>
            <input v-model="this.client_ride_data[0].pickUpLong" type="text" id="pickupLong" class="form-input">
          </div>
          <div class="form-group">
            <label for="pickupLat" class="form-label">pickup-latitude</label>
            <input v-model="this.client_ride_data[0].pickUpLat" type="text" id="pickupLat" class="form-input">
          </div>
          <div class="form-group">
            <label for="pickupResolvedAddr" class="form-label">pickup-resolved-address</label>
            <input v-model="this.client_ride_data[0].pickUpResolvedAddress" type="text" id="pickupResolvedAddr" class="form-input">
          </div>
          <div class="form-group">
            <label for="destinationResolvedAddr" class="form-label">destination-resolved-address</label>
            <input v-model="this.client_ride_data[0].destResolvedAddress" type="text" id="destinationResolvedAddr" class="form-input">
          </div>
          <div class="form-group">
            <label for="rideType" class="form-label">rideType</label>
            <input v-model="this.client_ride_data[0].rideType" type="text" id="rideType" class="form-input">
          </div>
          <div class="form-group">
            <label for="province" class="form-label">province</label>
            <input v-model="this.client_ride_data[0].province" type="text" id="province" class="form-input">
          </div>
          <div class="form-group">
            <label for="city" class="form-label">city</label>
            <input v-model="this.client_ride_data[0].city" type="text" id="state" class="form-input">
          </div>
          <div class="form-group">
            <button type="submit" class="form-btn" v-on:click="clientRequestRide">Submit</button> <!-- Add a submit button -->
          </div>
        </form>
      </div>
      <div class="table-container" v-if="this.identity=='passenger'">
        <table  class="custom-table">
          <tr v-for="(value, key) in this.client_ride_data[0]" :key="key">
            <td>{{ key }}</td>
            <td>{{ value }}</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="container" v-if="this.identity=='driver'">
      <!-- driver receive form -->
      <div class="driver-form-container" v-if="this.identity=='driver'">
        <form>
          <div class="form-group">
            <label for="driverId" class="form-label">driverId</label>
            <input v-model="this.driver_accepting_form[0].driverId" type="text" id="driverId" class="form-input">
          </div>

          <div class="form-group">
            <label for="latitude" class="form-label">latitude</label>
            <input v-model="this.driver_accepting_form[0].latitude" type="text" id="latitude" class="form-input">
          </div>
          <div class="form-group">
            <label for="longitude" class="form-label">longitude</label>
            <input v-model="this.driver_accepting_form[0].longitude" type="text" id="longitude" class="form-input">
          </div>
          <div class="form-group">
            <label for="license_plate_number" class="form-label">license-plate-number</label>
            <input v-model="this.driver_accepting_form[0].licensePlateNumber" type="text" id="license_plate_number" class="form-input">
          </div>
          <div class="form-group">
            <label for="vehicle_info" class="form-label">vehicle-info</label>
            <input v-model="this.driver_accepting_form[0].vehicleInfo" type="text" id="vehicle_info" class="form-input">
          </div>
          <div class="form-group">
            <button type="submit" class="form-btn" v-on:click="this.driver_accept_ride">Submit</button> <!-- Add a submit button -->
          </div>
        </form>

      </div>
      <div class="table-container" v-if="this.identity=='driver'">
        <table  class="custom-table">
          <tr v-for="(value, key) in this.driver_accepting_form[0]" :key="key">
            <td>{{ key }}</td>
            <td>{{ value }}</td>
          </tr>
        </table>
      </div>
      <div class="small-table-container" v-if="this.identity=='driver'">
        <table  class="custom-table">
          <tr v-for="(subscriptions, index) in this.subscriptions" :key="index">
            <td>{{ index }}</td>
            <td>{{ subscriptions.value }}</td>
          </tr>
        </table>
        <button v-on:click="this.driver_listening_on_channel" class="form-btn">GET SUBSCRIPTIONS</button>
      </div>
    </div>

  </div>




  </body>
</template>

<style scoped>
.map_ride_container{
  display: flex;
}
.container{
  display: flex;
  min-width: 1400px;
  margin-top: 30px;
}
.client-form-container,.driver-form-container{
  display: flex;
  /* max-width: 800px; */
  max-width: 40%;
  max-height: 2000px;
  margin: 20px auto 0;
  padding: 10px;
  border: 1px solid #ccc;

}
.form-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.form-label {
  flex: 1;
  margin-right: 10px;
  width: 200px;
}

.form-input {
  flex: 2;
  width: 30%;
}

.form-btn {
  font-size: 16px;
  border-radius: 5px;
  padding: 14px 25px;
  border: none;
  font-weight: 500;
  background-color: #6a64f1;
  color: white;
  cursor: pointer;
  margin-top: 25px;
}

.table-container {
  /*max-width: 800px; */
  max-width: 30%;
  display: flex;
  border: 1px solid #ccc;
  padding: 10px;
  overflow-x: auto; /* Enable horizontal scrolling if needed */
  margin: 10px auto 0;

}
.small-table-container{
  max-width: 20%;
  min-width: 300px;
  //max-width: 500px;
  border: 1px solid #ccc;
  padding: 10px;
  overflow-x: auto; /* Enable horizontal scrolling if needed */
  margin: 10px auto 0;
}
.custom-table {
  width: 100%;
  border-collapse: collapse;
}
.custom-table th{
  background-color: #f2f2f2;
}
.custom-table th, .custom-table td {

  padding: 8px;
  text-align: left;
  width: 120px;
}

.custom-table td:first-child {
  font-weight: bold;
  width: 60px;
}

.custom-table td:last-child {
  font-style: italic;
}



</style>