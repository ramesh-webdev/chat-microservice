import { useState } from "react";

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    onSend({ text, mine: true, _id: Date.now() });
    setText("");
  };

  return (
    <div className="p-3 border-t flex">
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onTyping(); // 👈 call this
        }}
        className="flex-1 border p-2 rounded"
        placeholder="Type a message"
      />

      <button
        onClick={send}
        className="ml-2 bg-green-600 text-white px-4 rounded"
      >
        Send
      </button>
    </div>
  );
}
