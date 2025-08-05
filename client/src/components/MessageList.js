import React, { useEffect, useRef } from 'react';

const MessageList = ({ messages, currentUser }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.username === currentUser ? 'own-message' : 'other-message'}`}
        >
          <div className="message-header">
            <span className="username">{msg.username}</span>
            <span className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="message-text">{msg.message}</div>
        </div>
      ))}
      <div ref={messagesEndRef} />
      <style jsx>{`
        .message-list {
          padding: 20px;
          overflow-y: auto;
          height: calc(100vh - 220px);
          background: #f8f9fa;
        }
        .message {
          margin: 16px 0;
          max-width: 80%;
          animation: fadeIn 0.3s ease-in;
          padding: 12px 16px;
          border-radius: 15px;
          background-color: #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .own-message {
          margin-left: auto;
          background-color: #1a73e8;
          color: white;
          box-shadow: 0 2px 4px rgba(26, 115, 232, 0.2);
        }
        .other-message {
          margin-right: auto;
          background-color: #ffffff;
          color: #333333;
        }
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 13px;
        }
        .username {
          font-weight: 600;
          color: #424242;
        }
        .own-message .username {
          color: #ffffff;
        }
        .timestamp {
          font-size: 11px;
          opacity: 0.8;
          margin-left: 8px;
        }
        .message-text {
          word-break: break-word;
          line-height: 1.4;
          font-size: 14px;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MessageList; 