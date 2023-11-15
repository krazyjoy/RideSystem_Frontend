<script>
import { ref} from "vue";
import axios from 'axios'
import address_db from '/src/address_db.json'
import {v4} from 'uuid'
// import driver_addr from "@/driver_addr.json";
// import router from "@/route";
import * as mqtt from 'mqtt/dist/mqtt.min';

export default{
    name: "trajectory-view",
    setup(){

          const mapCenter = ref({lat: 51.5072, lng:0.1276});

          const setupMap = (latitude, longitude) => {
            mapCenter.value.lat = latitude;
            mapCenter.value.lng = longitude;

          };
          const markerDetails = ref({
              id:1,
              position:mapCenter.value
          })
          const openMarkerID = ref(null)

          const locationDetails =ref({
              address:'',
              url:''
          })
          // set the location based on the place selected
          const setPlace = (place) =>{
            mapCenter.value.lat = place.geometry.location.lat();
            mapCenter.value.lng = place.geometry.location.lng();

            locationDetails.value.address = place.formatted_address
            locationDetails.value.url = place.url;
          }

        // open marker info window
        const openMarker = (id) => {
          openMarkerID.value =id;
        }
        const departureMarker = ref({ id: "departure", position: null});
        const destinationMarker =ref({ id: "destination", position: null});

        return {
            // coords,
            mapCenter,
            setPlace,
            setupMap,
            markerDetails,
            openMarkerID,
            openMarker,

            // setPlace,
            locationDetails,
            departureMarker,
            destinationMarker,

        }

    },
    data(){
        return {
            selectedOption: 'departure',
            latitude_pickup: '',
            longitude_pickup: '',
            latitude_arrive:'',
            longitude_arrive:'',
            formattedAddress_pickup: '',
            formattedAddress_arrive: '',
            province:'',
            city:'',
            plusCode:'',
            apiKey: 'AIzaSyBaad1eX3MUZ77NSTYQJvyBw0OLzipuaOo',
            address_json: address_db,
            latlng: '',
            setup_departure_marker: false,
            setup_destination_marker: false,
            saved_positions: [],
            markers:[],

            /* driver MQTT */
            // mqtt https://www.emqx.com/en/blog/how-to-use-mqtt-in-vue
            mqtt_group_driver:{
                connection:{
                    protocol: 'ws',
                    host: '192.168.12.218',
                    port: '8083',
                    endpoint:'/mqtt',
                    clean: false,
                    connectTimeout: 30 * 1000,
                    reconnectPeriod: 4000,
                    clientId: localStorage.getItem('user_id') + "_" + v4(),
                    username: 'admin',
                    password: 'public',
                    subscribeSuccess: false,
                    connecting: false,
                    retryTimes: 0,
                },

                subscription:{
                    topic: localStorage.getItem('driver_channel'),
                    qos: 2
                },
                subscribe:{
                    doSubscribe: false,
                    doUnSubscribe: false
                },
                publish:{
                    doPublish: true,
                    topic: localStorage.getItem('driver_channel'),
                    qos: 2,
                    payload: ''
                },
                driver:{
                    connected: false,
                },
                receiveNews: [],

            },
            driver: {
                driver_id: localStorage.getItem("driverId"),
                driverLat: localStorage.getItem("driverLat"),
                driverLng: localStorage.getItem("driverLng"),
                licensePlateNumber: localStorage.getItem("licensePlateNumber"),
                identity: localStorage.getItem("identity"),
                channel: localStorage.getItem("driver_channel"),
                driver_form: {
                    driverId: localStorage.getItem("driverId"),
                    latitude: localStorage.getItem("driverLat"),
                    longitude: localStorage.getItem("driverLng"),
                    licensePlateNumber: localStorage.getItem("licensePlateNumber"),
                    vehicleInfo: ""
                },
                accept_rideId: ''

            },
            driver_action: {
                driver_listening: -1,
                driver_accepted: -1,
                driver_navigation: -1,
                driver_action_log: [],
                accessed_4: false
            },
            driver_action_message:{
                listen_msg: "pending",
                accepted: "pending",
                navigation: "pending"
            },
            passenger_position: {
                departure_lat:'',
                departure_lng:'',
                destination_lat:'',
                destination_lng:''
            },
            // mapCenter: ref(({lat: 51.5072, lng:0.1276}))
        };
    },
    mounted() {

        //


          this.setupMap(32.631, -117.062);
          console.log("Updated map center", this.mapCenter);
          this.driver_accept_ride();


    },
    computed:{
        driver_get_ride_sessions() {
          return `/api/v1/ride/${this.driver.accept_rideId}`
        },
    },
    methods: {
          handleMapClick(event){
              console.log("event: ",event)
              this.handleInfoWindowClose();
          },
          handleMarkerClick(event){
                if(event.latLng != null){

                    this.markerDetails.position = {lat: event.latLng.lat(), lng: event.latLng.lng()};
                    console.log("Marker clicked! ID:");
                    this.locationDetails.address = this.geocodeAddress(this.markerDetails.position, "marker");

                    console.log("marker coordinates: ", this.markerDetails.position);



                }

          },
          handleInfoWindowClose(){
              this.openMarkerID = null;
          },
          setPassengerPlace(place){
                if(this.selectedOption === 'departure'){
                    this.latitude_pickup = place.lat;
                    this.longitude_pickup = place.lng;
                    localStorage.setItem('pickup_latitude', this.latitude_pickup);
                    localStorage.setItem('pickup_longitude', this.longitude_pickup);
                }
                else if(this.selectedOption === 'destination'){
                    this.latitude_arrive = place.lat;
                    this.longitude_arrive = place.lng;
                    localStorage.setItem('arrive_latitude', this.latitude_arrive);
                    localStorage.setItem('arrive_longitude',this.longitude_arrive);

                }

          },
          setup_static_markers(){
              this.departureMarker.position = {lat: this.passenger_position.departure_lat, lng: this.passenger_position.departure_lng};
              this.destinationMarker.position = {lat: this.passenger_position.destination_lat, lng:this.passenger_position.destination_lng}
              console.log("marker departure: ",this.departureMarker.position);
              console.log("marker destination: ",this.destinationMarker.position);
              this.setup_departure_marker = true;
              this.setup_destination_marker = true;

          },
          handleDynamicMarkerClick(event){
              // Handle the marker click
              const clickedLatLng = {
                  lat: event.latLng.lat(),
                  lng: event.latLng.lng()
              };

              this.markers.push({
                  position: clickedLatLng,
                  title: `Marker ${this.markers.length+1}`,
                  id: this.markers.length,
              })
              console.log('Dynamic Marker clicked!', this.markers);
              let rideId = this.driver.accept_rideId;
              console.log("rideId: ",rideId);
              let position_header = {
                  "gpsLatitude": clickedLatLng.lat,
                  "gpsLongitude": clickedLatLng.lng,
              }
              let lat = clickedLatLng.lat;
              let long = clickedLatLng.lng;


              /* create trajectory path && checks its distance to passenger (change ride status) */
              axios.post(`/api/v1/trajectory/create/${rideId}`, position_header, {
                  header: {"Content-Type": "application/json"}
              }).then(response => {
                  console.log("create trajectory", position_header);
                  console.log("response: ",response.data);
                  this.saved_positions.push({lat,long});
                  console.log("this.saved_positions list: ", this.saved_positions)

                  this.mqtt_group_driver.publish.doPublish = true;
                  this.mqtt_group_driver.publish.topic = this.driver.channel;


                  /* publish driver location to MQTT channel */
                  this.mqtt_group_driver.publish.payload = JSON.stringify({"driverLat": lat.toString(), "driverLng": long.toString()})
                  const {topic, qos, payload} = this.mqtt_group_driver.publish
                  console.log(`topic: ${topic}, qos: ${qos}, payload: ${payload}`)

                  this.mqtt_group_driver.driver.publish(topic, payload, {qos}, error => {
                      if(error){
                          console.log("publish location error", error);
                      }
                      else{
                          console.log("publish location payload", payload);
                          console.log("response", response.data)


                      }
                  })


              }).catch(error => {
                  console.log("error: ", error);
              })
          },
          fetchLocation(){
              const place = this.markerDetails.position;
              console.log("place: ", place)
              console.log("place.lat", place["lat"])
              if(this.selectedOption === 'destination'){
                  this.geocodeAddress(place, "destination");

                  console.log("arrive_address: ", localStorage.getItem('arrive_address'))

              }
              else if(this.selectedOption === 'departure'){
                  this.geocodeAddress(place, "departure");

                  console.log("pickup_address: ", localStorage.getItem('pickup_address'))
              }
              if(place != null){

                  this.setPassengerPlace(place);
                  this.setup_departure_marker = false;
                  this.setup_destination_marker = false;
                  this.setup_static_markers();
              }
          },
          trajectory_init(){

              this.saved_positions = [];


          },
          geocodeAddress(place, selected_option) {
              let latlng = `${parseFloat(place["lat"].toFixed(4))},${parseFloat(place["lng"].toFixed(4))}`
              console.log("latlng: ",latlng);
              this.latlng = latlng;
              // pickup
              axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
                  params: {

                    key: this.apiKey,
                    latlng: latlng,
                  }
              }).then((response) => {
                  // console.log('response: ',response);
                  const result = response.data.results[0];
                  // console.log("result: ", result);
                  if (result) {
                    this.formattedAddress_pickup = result.formatted_address;


                    localStorage.setItem('province',this.province);
                    localStorage.setItem('city', this.city);

                    console.log("result formatted_address", result.formatted_address);
                    if(selected_option == 'departure'){
                      localStorage.setItem('pickup_longitude', place["lng"].toString());
                      localStorage.setItem('pickup_latitude',place["lat"].toString());
                      localStorage.setItem('pickup_address',result.formatted_address.toString());
                    }
                    if(selected_option == 'destination'){
                      localStorage.setItem('arrive_longitude',place["lng"].toString());
                      localStorage.setItem('arrive_latitude',place["lat"].toString());
                      localStorage.setItem('arrive_address',result.formatted_address.toString());
                      //router.push('/rides')

                    }
                    if(selected_option == 'marker'){
                      return result.formatted_address;
                    }
                    return result.formatted_address
                  } else {
                    this.formattedAddress_pickup = 'No results found';
                  }
              })
                  .catch((error) => {
                    console.error('Error geocoding address: ', error);
                    console.error('Error geocoding address: ', error);
                  });
              return '';
          },

          /* MQTT METHODS */
          initConnectionData(identity){
            if(identity == 'passenger'){
              this.mqtt_group_client.connection.retryTimes = 0;
              this.mqtt_group_client.connection.connecting = false;
              this.mqtt_group_client.connection.subscribeSuccess = false;
              this.mqtt_group_client.publish.doPublish = false;
              this.mqtt_group_client.subscribe.doSubscribe = false;
            }
            if(identity == 'driver'){
              this.mqtt_group_driver.connection.retryTimes = 0;
              this.mqtt_group_driver.connection.connecting = false;
              this.mqtt_group_driver.connection.subscribeSuccess = false;
              this.mqtt_group_driver.publish.doPublish = false;
              this.mqtt_group_driver.subscribe.doSubscribe = false;
            }
          },
          handleOnReConnect(identity){
            if(identity == 'passenger'){
              this.mqtt_group_client.connection.retryTimes += 1;
              if(this.mqtt_group_client.retryTimes > 5){
                try{
                  this.mqtt_group_client.client.end();
                  this.initConnectionData("passenger");
                  console.log("Connection max reconnect times limit, stop retry");
                }catch(error){
                  console.log(error);
                }
              }
            }
            if(identity == 'driver'){
              this.mqtt_group_driver.connection.retryTimes += 1;
              if(this.mqtt_group_driver.retryTimes > 5){
                try{
                  this.mqtt_group_driver.client.end();
                  this.initConnectionData("driver");
                  console.log("Connection max reconnect times limit, stop retry");
                }
                catch(error){
                  console.log(error);
                }
              }
            }
          },
          createConnection(identity){
              try{
                  if(identity != "driver")
                      return
                  this.mqtt_group_driver.connection.connecting = true;
                  const {protocol, host, port, endpoint, ...options} = this.mqtt_group_driver.connection;
                  const connectUrl = `${protocol}://${host}:${port}${endpoint}`;
                  this.mqtt_group_driver.driver = mqtt.connect(connectUrl, options);
                  if(this.mqtt_group_driver.driver.on) {
                      this.mqtt_group_driver.driver.on("connect", () => {
                        this.mqtt_group_driver.connection.connecting = false;
                      });
                  }
              }catch(error){
                this.mqtt_group_driver.connection.connecting = false;
                console.log("mqtt.connect error", error);
              }
          },
          driver_listening_on_channel() {
              console.log("this.channel: ", this.channel);
              axios.get(this.get_subscriptions)
                  .then(response => {
                      console.log("get subscriptions response: ", response.data.data.client_id);
                      this.subscriptions = response.data.data.client_id;
                  }).catch(error => {
                  console.log("error", error)
              });
          },
          mqtt_listening_driver(payload){
            console.log("payload: ", payload)
              this.initConnectionData("driver");
              this.mqtt_group_driver.subscribe.doSubscribe = true;

              console.log("topic: ", this.driver.channel)

              this.createConnection(this.driver.identity);

              if(this.mqtt_group_driver.connection.connecting) {
                  this.mqtt_group_driver.subscribe.doSubscribe = true;

                  /* subscribing */
                  if (this.mqtt_group_driver.subscribe.doSubscribe) {
                      const {topic, qos} = this.mqtt_group_driver.subscription;
                      this.mqtt_group_driver.driver.subscribe(topic, {qos}, (error, res) => {
                          if (error) {
                              console.log('Subscribe to topics error', error)
                              this.mqtt_group_driver.subscribeSuccess= false;
                              return
                          }else {
                              this.mqtt_group_driver.subscribeSuccess = true;
                              console.log('Subscribe to topics res', res);

                              this.driver_action.driver_listening = 0;
                              this.log_driver_action();

                              //
                              /* publishing */
                              if (this.mqtt_group_driver.subscribeSuccess) {



                                  this.mqtt_accept_msg = new Map();
                                  this.mqtt_accept_msg.set("accepted", false);

                                  /* receiving message */
                                  console.log("receiving message")
                                  this.mqtt_group_driver.driver.on("message", (topic, message) => {
                                      try {
                                          console.log("message: ", message);
                                          const decoder = new TextDecoder('utf-8');
                                          const text = decoder.decode(message);
                                          console.log("text: ", text);

                                          let driver_accept_timeout;
                                          let driver_accept_interval;


                                          /* not accepted message */
                                          if (text != "{accepted=true}") {
                                              let map_again = new Map(Object.entries(JSON.parse(text)));
                                              console.log("map again: ", map_again)
                                              for (let [key, value] of map_again) {
                                                console.log(`key: ${key}`)
                                                console.log(`value: ${value}`)
                                                console.log(`${key}: ${value}`);

                                              }




                                              if (map_again.has("rid")) {


                                                  console.log("map.get(rid): ", map_again.get("rid"));

                                                  this.driver.accept_rideId = map_again.get("rid");

                                                  let driver_position = {
                                                      'longitude': this.driver.driverLat,
                                                      'latitude': this.driver.driverLng
                                                  }
                                                  /* find client departure */
                                                  axios.post(`/api/v1/ride/${this.driver.accept_rideId}`, driver_position, {
                                                    header: {"Content-Type": "application/json"}
                                                  }).then(response => {
                                                      console.log("response from get ride", response.data.data);
                                                      console.log(response.data.data["pickUpLocation"]);
                                                      console.log(response.data.data["pickUpLocation"]["longitude"]);
                                                      console.log(typeof(response.data.data["pickUpLocation"]["longitude"]));
                                                      this.passenger_position.departure_lat = response.data.data["pickUpLocation"]["latitude"];
                                                      this.passenger_position.departure_lng = response.data.data["pickUpLocation"]["longitude"];
                                                      this.passenger_position.destination_lat = response.data.data["destinationLocation"]["latitude"];
                                                      this.passenger_position.destination_lng = response.data.data["destinationLocation"]["longitude"];
                                                      this.setup_static_markers();
                                                      // this.passenger_position.departure_lng = parseFloat(response.data.data.pickUpLocation.longitude);
                                                      // this.passenger_position.destination_lat = parseFloat(response.data.data.destinationLocation.latitude);
                                                      // this.passenger_position.destination_lng = parseFloat(response.data.data.destinationLocation.longitude);
                                                      // this.setup_static_markers();
                                                      // /*adjust map center*/
                                                      this.setupMap(this.passenger_position.departure_lat, this.passenger_position.departure_lng);

                                                  })


                                                  console.log("driver accept ride url: ", this.driver_get_ride_sessions);



                                                  /* driver accept ride */
                                                  driver_accept_timeout = setTimeout(() => {
                                                    console.log("driver_accept_timeout");
                                                  }, 800000);

                                                  driver_accept_interval = setInterval(() => {

                                                      axios.put(this.driver_get_ride_sessions,
                                                          this.driver.driver_form
                                                      ).then(response => {

                                                          console.log("driver accept ride: response", response.data);
                                                          if (response.data.msg == "success") {
                                                              console.log("inside driver: ", "success");
                                                              clearInterval(driver_accept_interval);
                                                          }else{
                                                              this.driver_action.driver_listening = 2;
                                                              this.log_driver_action();
                                                          }
                                                      }).catch(error => {
                                                          console.log("driver accept ride: error", error);
                                                      });
                                                  }, 80000)

                                              }

                                          } /* not accepted message */
                                          else {
                                              clearInterval(driver_accept_interval);
                                              let mqtt_accept_msg = new Map();
                                              mqtt_accept_msg.set("accepted", true);
                                              console.log("mqtt_accept_msg: ", mqtt_accept_msg);
                                              /* TODO: LOAD DRIVER ACCEPTED MESSAGE ON CLIENT DISPLAY */
                                              this.driver_action.driver_listening = 3;
                                              this.log_driver_action();
                                              /* publish new address */
                                              console.log("publish new address");
                                              let driver_click_timeout = setTimeout(()=>{
                                                this.handleDynamicMarkerClick();
                                                this.driver_action.driver_listening = 4;
                                                this.log_driver_action();


                                              }, 10000);
                                              clearTimeout(driver_click_timeout);
                                              clearTimeout(driver_accept_timeout);
                                          }
                                          /* accepted message */
                                      }
                                      catch (error) {
                                          console.log('error receiving message from driver', error);
                                          return Number.POSITIVE_INFINITY;
                                      }


                                  });
                                  /* receiving message */
                              }
                          }
                          /* connecting */

                      });
                      if (this.mqtt_group_driver.subscribe.doUnSubscribe) {
                          const {topic} = this.mqtt_group_driver.subscription
                          this.mqtt_group_driver.driver.unsubscribe(topic, error => {
                            if (error) {
                              console.log('Unsubscribe error', error)

                            }
                          });
                      }
                  }
              }

              this.mqtt_group_driver.driver.on("error", (error) => {
                console.log("connection error: ", error);
              });

              this.mqtt_group_driver.driver.on("reconnect", ()=>{
                this.mqtt_group_driver.connection.retryTimes += 1;
                if(this.mqtt_group_driver.retryTimes > 5){
                  try{
                    this.mqtt_group_driver.driver.end();
                    this.initConnectionData("driver");
                    console.log("Connection max reconnect times limit, stop retry");
                  }catch(error){
                    console.log(error);
                  }
                }
              });

          },
          driver_accept_ride() {
              console.log("inside driver accept ride!")
              console.log('driver_id', this.driver.driver_id);

              this.mqtt_group_driver.driver.connected = false;
              this.mqtt_listening_driver(`${this.driver.driver_id} listening`);


          },
          log_driver_action(){
              if(this.driver_action.driver_listening == 0){
                  this.driver_action_message.listen_msg = `listen to channel: ${this.driver.channel}`
              }
              else if (this.driver_action.driver_listening == 1){
                  this.driver_action_message.listen_msg = `listen to channel: ${this.driver.channel}`+
                   `=> processing requested ride id from passenger: ${this.driver.accept_rideId}`
              }
              else if (this.driver_action.driver_listening == 2){
                  this.driver_action_message.listen_msg = `listen to channel: ${this.driver.channel} \n`+
                   `=> processing requested ride id from passenger: ${this.driver.accept_rideId}` +
                      `=> driver declined: ride accepted by others`
              }
              else if(this.driver_action.driver_listening == 3){
                  this.driver_action_message.listen_msg = `listen to channel: ${this.driver.channel}`+
                    `=> processing requested ride id from passenger: ${this.driver.accept_rideId}` +
                    `=> driver accepted ride: ${this.driver.accept_rideId}`
              }
              else if(this.driver_action.driver_listening == 4){
                  this.driver_action.accessed_4 = true
                  this.driver_action_message.listen_msg = `listen to channel: ${this.driver.channel}`+
                      `=> processing requested ride id from passenger: ${this.driver.accept_rideId}` +
                      `=> driver accepted ride: ${this.driver.accept_rideId}` +
                      `=> driver approaching: ${this.saved_positions}`
              }
              if(this.driver_action.accessed_4 == false){
                  this.driver_action.driver_action_log.push(this.driver_action_message);
              }

          }

    },
};
</script>

<template>
    <div class="gmap-container" ref="mapContainer">



      <!--Rendering the map on the page -->

        <div class="map-window">
          <GMapMap :center=this.mapCenter
                   :zoom="15"
                   map-type-id="terrain"
                   style="width: 80vw; height:60rem" @click="handleDynamicMarkerClick">


            <GMapMarker
                v-on:click="fetchLocation"
                v-if="departureMarker.position !== null"
                :center="departureMarker.position"
                :position="departureMarker.position"
                :clickable="false"
                :draggable="false"
                icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
            />


            <GMapMarker
                v-on:click="fetchLocation"
                v-if="destinationMarker.position !== null && destinationMarker.position != departureMarker.position"
                :position="destinationMarker.position"
                :clickable="false"
                :draggable="false"
                icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
            />
            <GMapMarker
                v-for="marker in markers"
                :key="marker.id"
                :position="marker.position"
                :clickable="true"
                :draggable="false"
                ref="markers"
                @click="handleDynamicMarkerClick(marker)"
            />
                          <GMapMarker
                                  :key="markerDetails.id"
                                  :position="markerDetails.position"
                                  :clickable="true"
                                  :draggable="false"
                                  @click="handleMarkerClick">
                                  <GMapInfoWindow
                                      v-if="locationDetails.address != ''"
                                      :closeclick="true"
                                      @closeclick="handleInfoWindowClose"
                                      :opened="openMarkerID === markerDetails.id"
                                      :options="{
                                          pixelOffset:{
                                            width:10,
                                            height:0
                                          },
                                          maxWidth: 320,
                                          maxHeight: 500
                                      }"
                                  class="gmap-info-window"
                                  >

                                  </GMapInfoWindow>
                          </GMapMarker>

          </GMapMap>
        </div>
      <div class="driver-actions-container">
        <p>Driver action: {{this.driver_action_message.listen_msg}}</p>
      </div>

      <button class="trajectory_reception-btn" @click="trajectory_init">Start Getting Trajectory</button>
    </div>


</template>

<style scoped>

.gmap-container {
  position: relative;
  max-width: 1500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0 auto; /* Center the container horizontally */
}

/* Styles for the driver actions container */
.driver-actions-container {
  position: relative;
  width: 600px;
  height: 100px; /* Adjust the height as needed */
  margin: auto;
  top: 200px;

  align-items: center;
  font-size:  18px;
  background-color: #fff;
  padding: 10px;
  font-family: Arial, sans-serif;

  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index:1
}

/* Styles for the map window */
.map-window {
  position: relative;
  height: 800px;
  width: 100%;
  top: 25px;
  margin: 10px;
}

/* Styles for the GMapMap component */
.gmap-map {
  width: 80vw;
  height: 60rem;
  margin: 0 auto; /* Center the map horizontally */
}

/* Styling for the trajectory reception button */
.trajectory_reception-btn {
  margin: auto;
  position: fixed;

  padding: 10px 20px;
  font-size: 16px;
  background-color: #007BFF;
  color: #fff;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

/* Styling for the location details in the info window */
.location-details {
  max-width: 300px;
}

/* Additional styling for the GMapInfoWindow if needed */
.gmap-info-window {
  /* Add styles as needed */
}

/* Media query for responsiveness */
@media screen and (max-width: 768px) {
  .gmap-map {
    width: 100%;
    height: 300px; /* Adjust the height for smaller screens */
  }
}

</style>
