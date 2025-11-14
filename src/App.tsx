import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import AppLayout from './pages/AppLayout';

const App: React.FC = () => {
    const [appStarted, setAppStarted] = useState(false);

    if (!appStarted) {
        return <LandingPage onStart={() => setAppStarted(true)} />;
    }

    return <AppLayout />;
};

export default App;
