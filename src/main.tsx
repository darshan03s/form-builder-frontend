import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { UserContextProvider } from './context/user-context-provider';
import { Toaster } from './components/ui/sonner.tsx';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <UserContextProvider>
      <App />
      <Toaster />
    </UserContextProvider>
  </BrowserRouter>
);
