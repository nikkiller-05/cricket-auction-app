import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

// Lazily-created single shared socket connection to the backend.
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE_URL);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
