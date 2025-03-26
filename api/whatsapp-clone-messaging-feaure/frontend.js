import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

export default function Chat({ userId }) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);

    useEffect(() => {
        socket.emit("join", userId);
        fetchConversations();
    }, [userId]);

    useEffect(() => {
        socket.on("receive_message", (msg) => {
            if (msg.senderId === currentChat || msg.receiverId === currentChat) {
                setMessages(prev => [...prev, msg]);
            } else {
                fetchConversations();
            }
        });

        socket.on("messages_read", () => fetchConversations());

        return () => socket.disconnect();
    }, [currentChat]);

    const fetchConversations = () => {
        fetch(`http://localhost:4000/api/conversations/${userId}`)
            .then(res => res.json())
            .then(data => setContacts(data));
    };

    const loadChat = (contactId) => {
        setCurrentChat(contactId);
        socket.emit("mark_read", { userId, contactId });
        fetch(`http://localhost:4000/api/messages/${userId}/${contactId}`)
            .then(res => res.json())
            .then(data => setMessages(data));
    };

    const sendMessage = () => {
        if (!currentChat) return alert("Select a chat first");
        socket.emit("send_message", { senderId: userId, receiverId: currentChat, message });
        setMessages(prev => [...prev, { senderId: userId, receiverId: currentChat, message }]);
        setMessage("");
    };

    return (
        <div style={{ display: "flex", gap: "20px", height: "100vh", padding: "10px" }}>
            {/* Contacts Sidebar */}
            <div style={{ width: "250px", borderRight: "1px solid gray", overflowY: "auto" }}>
                <h4>Chats</h4>
                {contacts.map(contact => (
                    <div key={contact.contact_id} onClick={() => loadChat(contact.contact_id)} style={{ cursor: "pointer", padding: "10px", backgroundColor: currentChat === contact.contact_id ? '#ddd' : 'white', borderBottom: "1px solid #eee" }}>
                        <b>Chat with {contact.contact_id}</b><br/>
                        <small>{contact.last_message}</small><br/>
                        {contact.unread_count > 0 && <span style={{ color: "red" }}>{contact.unread_count} unread</span>}
                    </div>
                ))}
            </div>

            {/* Chat Window */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {currentChat ? (
                    <>
                        <div style={{ flex: 1, overflowY: "scroll", padding: "10px", background: "#f9f9f9" }}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{ textAlign: msg.senderId === userId ? "right" : "left" }}>
                                    <div style={{ display: "inline-block", background: msg.senderId === userId ? "#acf" : "#ccc", padding: "5px 10px", borderRadius: "8px", margin: "4px", maxWidth: "70%" }}>
                                        {msg.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: "10px", padding: "10px", borderTop: "1px solid #ccc" }}>
                            <input style={{ flex: 1 }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message" />
                            <button onClick={sendMessage}>Send</button>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: "center", marginTop: "50%" }}>
                        <p>Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
}

