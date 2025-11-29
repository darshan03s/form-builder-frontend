import { Link } from 'react-router-dom';
import { buttonVariants } from './ui/button';

const Header = () => {
  return (
    <header className="flex items-center justify-between px-3 bg-secondary h-(--header-height) sticky top-0 left-0">
      <span>Form Builder</span>
      <div>
        <Link to="/auth/signin" className={buttonVariants({ variant: 'default', size: 'sm' })}>
          Sign In
        </Link>
      </div>
    </header>
  );
};

export default Header;
