<script>
import { defineComponent, ref} from "vue";
import axios from 'axios'
import address_db from '/src/address_db.json'
import router from '../route'


export default defineComponent({
    name: "gmap-view",
    setup(){

        // Setting default coordinates to London
        const coords = ref({lat: 51.5072, lng:0.1276})
        const markerDetails = ref({
            id:1,
            position:coords.value
        })
        const openMarkerID = ref(null)

        const locationDetails =ref({
            address:'',
            url:''
        })
        // set the location based on the place selected
        const setPlace = (place) =>{
          coords.value.lat = place.geometry.location.lat();
          coords.value.lng = place.geometry.location.lng();

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
          coords,
          markerDetails,
          openMarkerID,
          openMarker,
          setPlace,
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
            markers:[]

        };
    },
    mounted() {



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
              this.departureMarker.position = {lat: this.latitude_pickup, lng: this.longitude_pickup};
              this.destinationMarker.position = {lat: this.latitude_arrive, lng:this.longitude_arrive}
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
              console.log("clicked at lat: ", clickedLatLng.lat);
              console.log("clicked at lng: ", clickedLatLng.lng);

              this.markers.push({
                  position: clickedLatLng,
                  title: `Marker ${this.markers.length+1}`,
                  id: this.markers.length,
              })
              console.log('Dynamic Marker clicked!', this.markers);
          },
          fetchLocation(){
              const place = this.markerDetails.position;
              console.log("place: ", place)
              console.log("place.lat", place["lat"])
              if(this.selectedOption === 'destination'){
                  this.geocodeAddress(place, "destination");

                  console.log("arrive_address: ", localStorage.getItem('arrive_address'))
                  if(localStorage.getItem('pickup_address') != localStorage.getItem('arrive_address')){
                      console.log('pickup and arrive address are different');
                      setTimeout(() => {
                        console.log("waiting for further modifications");
                        router.push("/rides");
                      }, 100000);


                      console.log("finish waiting for arrive address modifications");
                  }

              }
              else if(this.selectedOption === 'departure'){
                  this.geocodeAddress(place, "departure");

                  console.log("pickup_address: ", localStorage.getItem('pickup_address'));

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

    },
});
</script>

<template>
    <div class="gmap-container">
        <div class="option-container">
            <select v-model="selectedOption" @change="fetchLocation">
              <option value="departure">Departure</option>
              <option value="destination">Destination</option>
            </select>
            <div v-if="selectedOption === 'departure'">
              <label for="departure">Departure</label>
            </div>
            <div v-if="selectedOption === 'destination'">
              <label for="destination">Destination</label>
            </div>
            <button class="search_location_btn" type="button" v-on:click="fetchLocation">Search For Location</button>
        </div>

    <div class="gmap">
        <div class="search-box">
            <GMapAutocomplete
                placeholder="Search for a location"
                @place_changed="setPlace"
                style="font-size: medium"
            >

           </GMapAutocomplete>
        </div>


      <!--Rendering the map on the page -->


      <GMapMap :center="coords"
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
                              maxHeight: 700
                          }"
                      class="gmap-info-window"
                      >

                      </GMapInfoWindow>
                <div class="location-details">
                  <h3>Location Details</h3>
                  <p>Address: {{locationDetails.address}}</p>
                  <p>Latlng: {{markerDetails.position}}</p>
                  <p>URL: <a :href="locationDetails.url" target="_blank">{{locationDetails.url}}</a></p>
                </div>

        </GMapMap>
    </div>

  </div>

</template>

<style scoped>
/* Add your custom styles here */
.gmap-container{
  position:relative;
  max-width: 1500px;
}
.option-container{
  position: relative;
  display: inline-block;
  width: 50px;
  height: 50px;
  font-family: Arial, sans-serif;
  top: 100px;
}

.option-container select{
  width: 150px;
  padding: 8px;
  font-size: 18px;
  border: none;
  border-raidus: 5px;
  background-color: #f8f8f8;
  color:#333333;
  cursor: pointer;
}
.option container label {
  font-size: 18px;
  font-weight: bold;
}

.option-container div{
  margin-top: 10px;
}

.option-container div:not(:first-child){
  display: none;
}
.gmap{
  position: relative;
  height:800px;
  width: 100%;
  top: 25px;
  margin: 10px;
}

.search-box{
  position: relative;
  margin: 100px 0px;
  padding: 40px;
  border-radius: 5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
.search_location_btn{
  position:absolute;
  margin: 100px 400px;
  top: 130px;
  z-index: 2;
}

.location-details {
  margin: 20px;
  color: black;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
  padding: 5px;
}
.trajectory_reception-btn{
    width: 100%;
    height: 80px;
}
.gmap-info-window{
  height: 500px;
}
</style>
