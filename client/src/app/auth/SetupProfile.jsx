import { useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

export default function SetupProfile() {
  const [name, setName] = useState("");
  const nav = useNavigate();
  const user = useAuthStore(s => s.user);

  const save = async () => {
    await api.put("/users/me", { name });
    nav("/chat");
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="p-6 border rounded w-80">
        <h2 className="text-xl mb-4">Your Name</h2>
        <input
          className="border p-2 w-full mb-3"
          placeholder="Enter your name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button onClick={save} className="bg-green-600 text-white w-full p-2">
          Continue
        </button>
      </div>
    </div>
  );
}
