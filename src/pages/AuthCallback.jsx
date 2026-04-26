import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { handleGoogleUserProfile } from '../components/AuthService';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      if (user) {
        // Ensure user profile is created for Google users
        await handleGoogleUserProfile(user);
        const hasDraft = localStorage.getItem('scanframe_qr_pending');
        setTimeout(() => navigate(hasDraft ? '/#newframes' : '/dashboard'), 1000);
      } else {
        // If no user after callback, redirect to auth page
        setTimeout(() => navigate('/signin'), 2000);
      }
    };

    handleCallback();
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="inline-block align-middle mr-2 w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
        <p className="text-secondary font-poltawski text-xl">Signing in...</p>
      </div>
    </div>
  );
}
