import './App.css';
import React from 'react';
import TbmModel from './components/TBM Model/tbmModel';
import { TbmStateProvider } from './components/TBM Model/TbmStateContext';
import TbmStateBanner from './components/TBM Model/TbmStateBanner';

function App() {
  return (
    <div className="App">
      <TbmStateProvider>
        <TbmStateBanner />
        <TbmModel />
      </TbmStateProvider>
    </div>
  );
}

export default App;
