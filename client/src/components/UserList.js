import React from 'react';

const UserList = ({ users }) => {
  return (
    <div className="user-list">
      <h3>Online Users ({users.length})</h3>
      <ul>
        {users.map((user) => (
          <li key={user} className="user-item">
            <div className="online-indicator"></div>
            <span className="username">{user}</span>
          </li>
        ))}
      </ul>
      <style jsx>{`
        .user-list {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 10px;
        }
        .user-list h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #2c3e50;
        }
        .user-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .user-item {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-radius: 6px;
          transition: background-color 0.2s;
        }
        .online-indicator {
          width: 8px;
          height: 8px;
          background-color: #4caf50;
          border-radius: 50%;
          margin-right: 10px;
          box-shadow: 0 0 0 2px #fff;
        }
        .username {
          color: #34495e;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default UserList; 