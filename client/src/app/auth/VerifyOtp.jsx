import { useState } from "react";
import api from "../../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const phone = sessionStorage.getItem("phone");
  const nav = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const type = location.state?.type || "login"; // Default to login if lost

  const verify = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp, type });
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);

      if (res.data.isNew) {
        nav("/setup-profile");
      } else {
        nav("/");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Verify Code</h2>
          <p className="text-white/70">We sent a code to <span className="font-semibold text-white">{phone}</span></p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-1 pl-1">One-Time Password</label>
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium tracking-wide text-center text-lg tracking-[0.5em]"
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              onKeyDown={e => e.key === 'Enter' && verify()}
            />
          </div>

          <button
            onClick={verify}
            disabled={loading}
            className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-white/90 focus:ring-4 focus:ring-white/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg flex justify-center items-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Verify Identity"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => nav(-1)} className="text-white/60 hover:text-white text-sm hover:underline">
            Wrong number? Go back
          </button>
        </div>
      </div>
    </div>
  );
}
