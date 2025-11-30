import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, buttonVariants } from './ui/button';
import { useUser } from '@/hooks';
import { User } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const Header = () => {
  const { user, loadingUser, updateUserContext } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname.includes('auth');

  function handleLogout() {
    localStorage.removeItem('airtableUserId');
    updateUserContext({ userId: '', email: '' });
    navigate('/auth/signin');
  }

  return (
    <header className="flex items-center justify-between px-3 bg-secondary h-(--header-height) sticky top-0 left-0">
      <Link to={'/'}>Form Builder</Link>
      <div>
        {loadingUser ? null : user.userId ? (
          <Popover>
            <PopoverTrigger>
              <Button asChild variant={'outline'} size={'icon'}>
                <User className="h-8 w-8 p-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="mr-4">
              <div className="flex flex-col gap-4">
                <span className="text-xs text-center">{user.email}</span>
                <Button onClick={handleLogout}>Logout</Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : isAuthPage ? null : (
          <Link to="/auth/signin" className={buttonVariants({ variant: 'default', size: 'sm' })}>
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
