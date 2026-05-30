'use client';

import { createContext, useContext, useState } from 'react';
import { MISSION } from '../lib/missionConfig';

const MissionContext = createContext();

export function MissionProvider({ children }) {
  const [launchDate, setLaunchDate] = useState(MISSION.launchDate);
  const [activeView, setActiveView] = useState('2d'); // '3d', '2d', or 'split'

  return (
    <MissionContext.Provider value={{
      launchDate,
      setLaunchDate,
      activeView,
      setActiveView
    }}>
      {children}
    </MissionContext.Provider>
  );
}

export function useMission() {
  return useContext(MissionContext);
}
