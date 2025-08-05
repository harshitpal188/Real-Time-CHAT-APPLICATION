import React, { memo } from 'react';

const TypingIndicator = memo(({ typingUsers, currentUser }) => {
  const otherTypingUsers = typingUsers.filter(user => user !== currentUser);

  if (otherTypingUsers.length === 0) {
    return null;
  }

  let message;
  if (otherTypingUsers.length === 1) {
    message = `${otherTypingUsers[0]} is typing...`;
  } else if (otherTypingUsers.length === 2) {
    message = `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing...`;
  } else {
    message = `${otherTypingUsers.length} people are typing...`;
  }

  return (
    <div className="typing-indicator" role="status" aria-live="polite">
      <div className="typing-animation">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
      <span className="typing-text">{message}</span>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator; 