import { useState } from 'react';
import { UserContext, type User } from './user-context';

export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>({
    userId: '',
    email: '',
    accessToken: ''
  });
  const [loadingUser, setLoadingUser] = useState(true);

  function updateUserContext(data: User) {
    setUser(data);
    setLoadingUser(false);
  }

  return (
    <UserContext.Provider value={{ user, loadingUser, updateUserContext }}>
      {children}
    </UserContext.Provider>
  );
};
