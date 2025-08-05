import React from 'react';

const SendButton = ({ disabled, onClick }) => {
  const buttonStyle = {
    width: '40px',
    height: '40px',
    padding: '8px',
    border: 'none',
    borderRadius: '50%',
    backgroundColor: disabled ? '#e0e0e0' : '#1a73e8',
    color: 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(26, 115, 232, 0.2)',
    opacity: disabled ? 0.7 : 1,
  };

  return (
    <button
      type="submit"
      disabled={disabled}
      aria-label="Send message"
      style={buttonStyle}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#1557b0';
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(26, 115, 232, 0.3)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#1a73e8';
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(26, 115, 232, 0.2)';
        }
      }}
    >
      <svg 
        viewBox="0 0 24 24" 
        width="20" 
        height="20" 
        fill="currentColor"
        style={{ transform: 'rotate(-42deg)' }}
      >
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    </button>
  );
};

export default SendButton; 