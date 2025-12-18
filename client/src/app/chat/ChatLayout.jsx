
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';

export default function ChatLayout(){
  return (
    <div className="h-screen flex">
      <div className="w-80 border-r">
        <ChatList />
      </div>
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  );
}
