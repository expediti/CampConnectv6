
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import AppLayout from './components/AppLayout';

const App: React.FC = () => {
    const [appStarted, setAppStarted] = useState(false);

    if (!appStarted) {
        return <LandingPage onStart={() => setAppStarted(true)} />;
    }

    return <AppLayout />;
};

export default App;
