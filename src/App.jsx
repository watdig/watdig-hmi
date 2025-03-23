import './App.css';
import React from 'react';
import Homepage from './pages/Homepage';
import TbmModel from './components/TBM Model/tbmModel';
import { TbmStateProvider } from './components/TBM Model/TbmStateContext';

function App() {
  return (
    <div className="App">
      <TbmStateProvider>
        <TbmModel />
      </TbmStateProvider>
    </div>
  );
}

export default App;
