<script>

import axios from 'axios';
import router from '../route'

  export default{
    name: "users-view",
    data(){
      return {
        login_user_id:'',
        user_data: [],
        identity: localStorage.getItem('identity'),
        channel: localStorage.getItem('channel')
      }
    },
    computed:{
      get_specific_user_url(){
        return `/user/getuser/${this.user_id}`
      },
      get_specific_user_by_name_url(){
        return `/user/getuser/username`
      }
    },
    methods:{
      getUsers() {
        console.log('get users');
        axios.get('/api/v1/user/getusers')
            .then(response => {
              console.log('get users successful', response.data);
            })
            .catch(error => {
              console.log('get users failed', error);
            })
      },
      routing_url(){
          if(this.identity=='driver'){
              console.log("to /rides")
              router.push("/rides")
          }
          if(this.identity == 'passenger'){
              console.log("to /map")
              router.push("/map");
          }

      }
    },
    mounted(){
        console.log('users: user data local storage ', localStorage.getItem('user_data'))
        var tmp = JSON.parse(localStorage.getItem('user_data'));

        for (const key in tmp) {
          console.log(`${key}: ${tmp[key]}`);
        }

      this.user_data = [JSON.parse(localStorage.getItem('user_data'))]
      console.log('users: user data', this.user_data[0])
      if(this.identity == 'driver'){
          localStorage.setItem("user_id", this.user_data[0].uid)
          localStorage.setItem('driver_license_plate_number', this.user_data[0].licensePlateNumber)
          localStorage.setItem("driver_channel", this.user_data[0].state)
      }
    }
  }
</script>

<template>
  <h2>Users Related Methods</h2>

    <div>
      <table class="custom-table">
        <tr v-for="(value, key) in this.user_data[0]" :key="key">
          <td>{{ key }}</td>
          <td>{{ value }}</td>
        </tr>
      </table>
      <br><br>
      <button v-on:click="routing_url">REQUEST RIDES OR CHECK OUT RIDES</button>
    </div>


</template>

<style >
/* styles.css */
.custom-table {
  width: 100%;
  border-collapse: collapse;
}

.custom-table th, .custom-table td {
  border: 1px solid #ccc;
  padding: 8px;
}

</style>