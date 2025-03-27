// Improved React Chat App (Production-ready structure)
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000'); // Connect to Socket.IO server

export default function ChatApp() {
    const [conversations, setConversations] = useState([]); // All conversations
    const [activeConversation, setActiveConversation] = useState(null); // Selected conversation object
    const [messages, setMessages] = useState([]); // Messages of active conversation
    const [message, setMessage] = useState(''); // Input message
    const [currentUser, setCurrentUser] = useState(null); // Logged-in user info

    // Fetch user info (simulate auth)
    useEffect(() => {
        axios.get('http://localhost:5000/api/me') // Replace with real auth
            .then(res => setCurrentUser(res.data))
            .catch(err => console.error(err));
    }, []);

    // Load all conversations
    useEffect(() => {
        if (!currentUser) return;

        axios.get('http://localhost:5000/api/conversations')
            .then(res => setConversations(res.data))
            .catch(err => console.error(err));

        return () => {
            socket.off('receive_message');
        };
    }, [currentUser]);

    // Load messages and join socket room
    useEffect(() => {
        if (!activeConversation) return;

        socket.emit('join_conversation', activeConversation.id);

        axios.get(`http://localhost:5000/api/messages/${activeConversation.id}`)
            .then(res => setMessages(res.data))
            .catch(err => console.error(err));

        socket.on('receive_message', (data) => {
            setMessages((prev) => [...prev, data]);
        });

        return () => {
            socket.off('receive_message');
        };

    }, [activeConversation]);

    // Handle input change
    const handleTyping = (e) => {
        setMessage(e.target.value);
    };

    // Send message
    const sendMessage = () => {
        if (!message || !activeConversation || !currentUser) return;
        const newMsg = {
            conversation_id: activeConversation.id,
            sender_id: currentUser.id,
            message,
            status: 'sent'
        };
        socket.emit('send_message', newMsg);
        setMessages((prev) => [...prev, { ...newMsg, sender_id: currentUser.id }]);
        setMessage('');
    };

    return (
        <div className="flex h-screen">
            {/* Conversation List */}
            <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Chats</h2>
                {conversations.map((conv) => {
                    const otherUser = conv.buyer.id === currentUser?.id ? conv.seller : conv.buyer;
                    return (
                        <div
                            key={conv.id}
                            className={`p-2 rounded cursor-pointer mb-2 ${activeConversation?.id === conv.id ? 'bg-blue-300' : 'bg-white'}`}
                            onClick={() => setActiveConversation(conv)}
                        >
                            <div className="font-semibold">{otherUser.name}</div>
                            <div className="text-xs text-gray-500">{otherUser.email}</div>
                        </div>
                    );
                })}
            </div>

            {/* Active Chat */}
            <div className="flex-1 flex flex-col p-4">
                {activeConversation ? (
                    <>
                        <div className="flex-1 overflow-y-auto border rounded p-2 space-y-2">
                            {messages.map((msg, idx) => {
                                const isMine = msg.sender_id === currentUser?.id;
                                return (
                                    <div key={idx} className={`p-2 rounded ${isMine ? 'bg-green-200 self-end' : 'bg-gray-200 self-start'}`}>
                                        <strong>{isMine ? 'You' : (isMine ? '' : activeConversation.buyer.id === currentUser?.id ? activeConversation.seller.name : activeConversation.buyer.name)}</strong>: {msg.message}
                                        <div className="text-xs text-right text-gray-500">
                                            {msg.status === 'seen' ? 'Seen' : 'Delivered'}
                                        </div>
                                    </div>
                                );
                            })}
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

