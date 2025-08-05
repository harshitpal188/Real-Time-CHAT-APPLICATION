import React, { useState, useCallback, useRef, memo, useEffect } from 'react';
import SendButton from './SendButton';

const EMOJIS = ['😊','😂','😍','👍','🎉','❤️','🔥','✨','🙌','🎈'];

const MessageInput = memo(({ onSend, onTyping, disabled }) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const lastTypingTime = useRef(0);
  const typingTimeout = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }, [message]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage || disabled) return;
    
    onSend(trimmedMessage);
    setMessage('');
    onTyping(false);
    
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, onSend, onTyping, disabled]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    if (value.length <= 1000) {
      setMessage(value);
      
      const now = Date.now();
      if (now - lastTypingTime.current > 1000) {
        lastTypingTime.current = now;
        onTyping(true);
        
        if (typingTimeout.current) {
          clearTimeout(typingTimeout.current);
        }
        
        typingTimeout.current = setTimeout(() => {
          onTyping(false);
          typingTimeout.current = null;
        }, 3000);
      }
    }
  }, [onTyping]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit, isComposing]);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  const handleEmoji = useCallback((emoji) => {
    setMessage(prev => {
      const newMessage = prev + emoji;
      if (newMessage.length <= 1000) {
        return newMessage;
      }
      return prev;
    });
    setShowEmojis(false);
    textareaRef.current?.focus();
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmojis) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest('.emoji-picker') && !e.target.closest('.emoji-btn')) {
        setShowEmojis(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showEmojis]);

  const remainingChars = 1000 - message.length;
  const showCharCount = message.length > 800;

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <div className="message-input-wrapper">
        <button 
          type="button" 
          className="emoji-btn" 
          onClick={() => setShowEmojis(v => !v)} 
          disabled={disabled}
          aria-label="Open emoji picker"
        >
          😊
        </button>
        {showEmojis && (
          <div className="emoji-picker">
            {EMOJIS.map(emoji => (
              <button 
                type="button" 
                key={emoji} 
                onClick={() => handleEmoji(emoji)}
                aria-label={`Add ${emoji} emoji`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="Type a message..."
          aria-label="Message input"
          rows={1}
          maxLength={1000}
          className="message-input"
          disabled={disabled}
        />
        {showCharCount && (
          <div className="char-count" style={{ color: remainingChars < 50 ? '#f44336' : 'inherit' }}>
            {remainingChars}
          </div>
        )}
      </div>
      <SendButton disabled={disabled || !message.trim()} />
    </form>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput; 