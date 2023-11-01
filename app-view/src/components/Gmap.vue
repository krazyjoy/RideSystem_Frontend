<script>
import { defineComponent } from "vue";
import axios from 'axios'
import address_db from '/src/address_db.json'


export default defineComponent({
  name: "GMap",

  data(){
    return {
      latitude_pickup: '',
      longitude_pickup: '',
      latitude_arrive:'',
      longitude_arrive:'',
      formattedAddress_pickup: null,
      formattedAddress_arrive: null,
      plusCode:'',
      apiKey: 'AIzaSyBaad1eX3MUZ77NSTYQJvyBw0OLzipuaOo',
      address_json: address_db

    };
  },
  mounted() {
    // var latMin = -90;
    // var latMax = 90;
    // var longMin = -180;
    // var longMax = 180;
    // this.latitude = latMin + Math.random() * (latMax - latMin);
    // this.longitude = longMin + Math.random()*(longMax - longMin);
    var address_id_pickup = Math.floor(Math.random()*this.address_json.length);
    console.log("pickup: address_id: ", address_id_pickup)
    this.latitude_pickup = this.address_json[address_id_pickup].latitude;
    this.longitude_pickup = this.address_json[address_id_pickup].longitude;
    var address_id_arrive = Math.floor(Math.random()*this.address_json.length);
    console.log("arrive: address_id: ", address_id_arrive)
    this.latitude_arrive = this.address_json[address_id_arrive].latitude;
    this.longitude_arrive = this.address_json[address_id_arrive].longitude;

    this.geocodeAddress();
    //console.log('gmap: pickup address: ',localStorage.getItem('arrival_address'));

  },
  methods: {

    geocodeAddress() {

      // pickup
      axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
        params: {
          latlng: `${this.latitude_pickup},${this.longitude_pickup}`,
          key: this.apiKey,
        }
      }).then((response) => {
        console.log('response: ',response);
        const result = response.data.results[0];
        console.log("result: ", result);
        if (result) {
          this.formattedAddress_pickup = result.formatted_address;
          localStorage.setItem('pickup_longitude', this.longitude_pickup);
          localStorage.setItem('pickup_latitude',this.latitude_pickup);
          localStorage.setItem('pickup_address',this.formattedAddress_pickup);
        } else {
          this.formattedAddress_pickup = 'No results found';
        }
      })
          .catch((error) => {
            console.error('Error geocoding address: ', error);
            console.error('Error geocoding address: ', error);
          });
      // arrive
      axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
        params: {
          latlng: `${this.latitude_arrive},${this.longitude_arrive}`,
          key: this.apiKey,
        }
      }).then((response) => {
        console.log('response: ',response);
        const result = response.data.results[0];
        console.log("result: ", result);
        if (result) {
          this.formattedAddress_arrive = result.formatted_address;
          localStorage.setItem('arrival_longitude', this.longitude_arrive);
          localStorage.setItem('arrival_latitude',this.latitude_arrive);
          localStorage.setItem('arrival_address',this.formattedAddress_arrive);
        } else {
          this.formattedAddress_arrive = 'No results found';
        }
      })
          .catch((error) => {
            console.error('Error geocoding address: ', error);
            console.error('Error geocoding address: ', error);
          });
    },
  }
});
</script>

<template>

  <div>
    <p>Latitude: <input v-model="latitude_pickup"/></p>
    <p>Longitude: <input v-model="longitude_pickup"/></p>
    <!--button @click="geocodeAddress">Find Nearest Address</button-->
    <div v-if="formattedAddress_pickup">{{formattedAddress_pickup}}</div>
    <p>Latitude: <input v-model="latitude_arrive"/></p>
    <p>Longitude: <input v-model="longitude_arrive"/></p>
    <!--button @click="geocodeAddress">Find Nearest Address</button-->
    <div v-if="formattedAddress_arrive">{{formattedAddress_arrive}}</div>
<!--  </div>-->
<!--  <div>-->
<!--    <ul>-->
<!--      <li v-for="(item, index) in address_json" :key="index">-->
<!--        <div v-for="(value, key) in item" :key="key">-->
<!--          {{key}}:{{value}}-->
<!--        </div>-->
<!--      </li>-->
<!--    </ul>-->
<!--  </div>-->
  </div>
</template>

<style scoped>
/* Add your custom styles here */
</style>
