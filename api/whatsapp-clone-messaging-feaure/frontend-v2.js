import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function ChatApp() {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        // Join socket room for the user
        socket.emit('join');

        // Load all conversations on mount
        socket.emit('get_conversations');

        socket.on('conversations', (data) => {
            setConversations(data);
        });

        // Listen for incoming messages
        socket.on('receive_message', (data) => {
            if (data.conversation_id === activeConversation) {
                setMessages((prev) => [...prev, data]);
            }
        });

        // Listen for typing status
        socket.on('typing', (data) => {
            if (data.conversation_id === activeConversation) {
                setIsTyping(data.isTyping);
            }
        });

        // Load messages when switching conversations
        if (activeConversation) {
            socket.emit('get_messages', activeConversation);
            socket.on('messages', (data) => {
                setMessages(data);
            });
        }

        return () => {
            socket.off('receive_message');
            socket.off('messages');
            socket.off('conversations');
            socket.off('typing');
        };
    }, [activeConversation]);

    const handleTyping = (e) => {
        setMessage(e.target.value);
        socket.emit('typing', { conversation_id: activeConversation, isTyping: e.target.value.length > 0 });
    };

    const sendMessage = () => {
        if (!message || !activeConversation) return;
        socket.emit('send_message', { conversation_id: activeConversation, message });
        setMessages((prev) => [...prev, { sender: 'Me', message }]);
        setMessage('');
        socket.emit('typing', { conversation_id: activeConversation, isTyping: false });
    };

    return (
        <div className="flex h-screen">
            {/* Conversation List */}
            <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Chats</h2>
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        className={`p-2 rounded cursor-pointer mb-2 ${activeConversation === conv.id ? 'bg-blue-300' : 'bg-white'}`}
                        onClick={() => setActiveConversation(conv.id)}
                    >
                        {conv.name || `Conversation ${conv.id}`}
                    </div>
                ))}
            </div>

            {/* Active Chat */}
            <div className="flex-1 flex flex-col p-4">
                {activeConversation ? (
                    <>
                        <div className="flex-1 overflow-y-auto border rounded p-2">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`p-2 mb-2 rounded ${msg.sender === 'Me' ? 'bg-green-200 self-end' : 'bg-gray-200 self-start'}`}>
                                    <strong>{msg.sender}</strong>: {msg.message}
                                </div>
                            ))}
                            {isTyping && <div className="text-sm text-gray-500">Someone is typing...</div>}
                        </div>
                        <div className="flex mt-2">
                            <input
                                type="text"
                                className="flex-1 border rounded p-2 mr-2"
                                value={message}
                                onChange={handleTyping}
                                placeholder="Type a message"
                            />
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                                onClick={sendMessage}
                            >
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-gray-500">Select a conversation to start chatting</div>
                )}
            </div>
        </div>
    );
}

