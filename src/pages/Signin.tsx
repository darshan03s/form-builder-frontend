import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

const Signin = () => {
  const { updateUserContext, user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user.userId) {
      navigate('/');
    }
  }, []);

  useEffect(() => {
    const success = searchParams.get('success');

    if (success) {
      const userId = searchParams.get('userId')!;
      const email = searchParams.get('email')!;
      const accessToken = searchParams.get('accessToken')!;

      updateUserContext({ userId, email, accessToken });
      localStorage.setItem('formBuilderUserId', userId);

      navigate('/');
    }
  }, [searchParams, navigate]);

  const handleSignIn = () => {
    window.location.href = `${import.meta.env.API_BASE_URL}/auth/airtable`;
  };

  return (
    <div className="h-full overflow-y-auto flex justify-center items-center">
      {searchParams.get('success') ? (
        <div>Signin Success. Redirecting...</div>
      ) : (
        <Button onClick={handleSignIn}>Sign in with Airtable</Button>
      )}
    </div>
  );
};

export default Signin;
