
import { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export default function VerifyOtp(){
  const [otp, setOtp] = useState('');
  const phone = sessionStorage.getItem('phone');
  const nav = useNavigate();
  const setAuth = useAuthStore(s=>s.setAuth);

  const verify = async () => {
    const res = await api.post('/auth/verify-otp', { phone, otp });
    setAuth(res.data.user, res.data.token);
    nav('/chat');
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="p-6 border rounded w-80">
        <h2 className="text-xl mb-4">Verify OTP</h2>
        <input className="border p-2 w-full mb-3" placeholder="OTP" value={otp} onChange={e=>setOtp(e.target.value)} />
        <button onClick={verify} className="bg-green-600 text-white w-full p-2">Verify</button>
      </div>
    </div>
  );
}
