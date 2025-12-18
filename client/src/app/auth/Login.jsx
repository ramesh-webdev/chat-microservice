
import { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const [phone, setPhone] = useState('');
  const nav = useNavigate();

  const sendOtp = async () => {
    await api.post('/auth/send-otp', { phone });
    sessionStorage.setItem('phone', phone);
    nav('/verify');
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="p-6 border rounded w-80">
        <h2 className="text-xl mb-4">Login</h2>
        <input className="border p-2 w-full mb-3" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
        <button onClick={sendOtp} className="bg-green-600 text-white w-full p-2">Send OTP</button>
      </div>
    </div>
  );
}
