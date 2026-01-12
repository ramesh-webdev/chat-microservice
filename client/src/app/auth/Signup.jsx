import { useState } from 'react';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    const sendOtp = async () => {
        if (!phone) return;
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { phone, type: 'signup' });
            sessionStorage.setItem('phone', phone);
            nav('/verify', { state: { type: 'signup' } });
        } catch (err) {
            alert(err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                    <p className="text-white/70">Join us and start chatting today</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-white/80 text-sm font-medium mb-1 pl-1">Phone Number</label>
                        <input
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium tracking-wide"
                            placeholder="+1 555 000 0000"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendOtp()}
                        />
                    </div>

                    <button
                        onClick={sendOtp}
                        disabled={loading}
                        className="w-full bg-white text-purple-600 font-bold py-3 rounded-xl hover:bg-white/90 focus:ring-4 focus:ring-white/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg flex justify-center items-center"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : "Sign Up"}
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-white/60">
                        Already have an account?{' '}
                        <Link to="/login" className="text-white font-bold hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
