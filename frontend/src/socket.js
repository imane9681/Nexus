import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let isConnecting = false;

export const getSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }
  
  if (isConnecting) {
    return socket;
  }
  
  isConnecting = true;
  
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    autoConnect: true
  });
  
  socket.on('connect', () => {
    isConnecting = false;
    console.log('Socket connected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    isConnecting = false;
  });
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnecting = false;
  }
};