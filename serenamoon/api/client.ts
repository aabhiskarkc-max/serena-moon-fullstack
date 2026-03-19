import axios from 'axios';
import { io } from "socket.io-client";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token =  localStorage.getItem('serena_token');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } 
      
    } catch (error) {
      console.error("Error fetching token", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


export const socket = io("process.env.NEXT_PUBLIC_API_UR", {
  transports: ["websocket"], 
  autoConnect: false,
});