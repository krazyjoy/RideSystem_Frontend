import axios from 'axios'

const geocodingService = axios.create({
    baseURL: 'http://maps.googleapis.com/maps/api/geocode/json',
})

export default geocodingService;
