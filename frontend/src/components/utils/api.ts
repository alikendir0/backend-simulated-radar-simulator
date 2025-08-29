import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

export const fetchAircraftByPart = async (partId: string) => {
    const response = await axios.post(`${API_BASE_URL}/aircraft/by-part`, { partId });
    return response.data;
};

export const editAircraftTopSpeed = async (partId: string, newTopSpeed: number) =>{
    const response = await axios.post(`${API_BASE_URL}/aircraft/update-top-speed`, { partId, newTopSpeed });
    return response.data;
}

export const fetchAircraftByName = async (name: string) => {
    const response = await axios.post(`${API_BASE_URL}/aircraft/by-name`, { name });
    return response.data;
};


