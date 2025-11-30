import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/header';
import Signin from './pages/Signin';
import { useEffect } from 'react';
import { API_BASE_URL } from './config';
import { useUser } from './hooks';

const App = () => {
  const navigate = useNavigate();
  const { updateUserContext } = useUser();

  useEffect(() => {
    const userId = localStorage.getItem('airtableUserId');

    if (userId) {
      fetch(API_BASE_URL + `/auth/verify?userId=${userId}`).then((res) => {
        if (res.status === 401) {
          navigate('/auth/signin');
        } else {
          res.json().then((data) => {
            console.log(data);
            updateUserContext(data);
          });
        }
      });
    } else {
      navigate('/auth/signin');
    }
  }, []);

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
