
import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import EntryPage from './pages/EntryPage';
import MainPage from './pages/MainPage';

const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>(AppState.ENTRY);
  const [nickname, setNickname] = useState<string>('');

  const handleLogin = (name: string) => {
    setNickname(name);
    setCurrentState(AppState.MAIN);
  };

  const handleLogout = () => {
    setNickname('');
    setCurrentState(AppState.ENTRY);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {currentState === AppState.ENTRY ? (
        <EntryPage onLogin={handleLogin} />
      ) : (
        <MainPage nickname={nickname} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
