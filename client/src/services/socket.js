
import { io } from 'socket.io-client';

let socket;

export const connectSocket = (token) => {
  socket = io(import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4000', {
    auth: { token }
  });
  return socket;
};

export const getSocket = () => socket;
