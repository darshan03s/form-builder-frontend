import { createContext } from 'react';

export type User = {
  userId: string;
  email: string;
  accessToken: string;
};

type UserContextType = {
  user: User;
  loadingUser: boolean;
  updateUserContext: (data: User) => void;
};

export const UserContext = createContext<UserContextType | null>(null);
