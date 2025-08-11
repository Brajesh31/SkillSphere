// frontend/src/context/RoomContext.jsx
import { createContext, useContext, useState } from 'react';

const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [peers, setPeers] = useState([]);

  return (
    <RoomContext.Provider value={{ currentRoom, setCurrentRoom, peers, setPeers }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => useContext(RoomContext);