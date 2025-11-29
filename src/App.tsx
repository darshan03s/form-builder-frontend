import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/header';
import Signin from './pages/Signin';

const App = () => {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 h-[calc(100vh-var(--header-height))] overflow-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/signin" element={<Signin />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
