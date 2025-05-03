import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import GifPicker from 'gif-picker-react';

// Function to create and mount the GIF picker
export function openGifPicker(
  containerId,
  tenorApiKey,
  clientKey,
  onGifSelect
) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID ${containerId} not found`);
    return;
  }

  // Create a root for React to render into
  const root = ReactDOM.createRoot(container);

  // Render the GIF picker component
  root.render(
    <GifPickerWrapper
      tenorApiKey={tenorApiKey}
      clientKey={clientKey}
      onGifSelect={onGifSelect}
      onClose={() => root.unmount()}
    />
  );

  return () => root.unmount();
}

// React component to render the GIF picker
function GifPickerWrapper({ tenorApiKey, clientKey, onGifSelect, onClose }) {
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState(null);

  const handleGifClick = (gif) => {
    // Log the gif object to debug its structure
    console.log('Selected GIF:', gif);

    // Check for a valid GIF URL
    let gifUrl;
    if (gif.url) {
      gifUrl = gif.url; // Use the direct url property
    } else if (gif.preview?.url) {
      gifUrl = gif.preview.url; // Fallback to preview URL
    } else if (gif.media_formats?.gif?.url) {
      gifUrl = gif.media_formats.gif.url; // Fallback for older Tenor API format
    } else if (gif.media && gif.media[0]?.gif?.url) {
      gifUrl = gif.media[0].gif.url; // Fallback for very old Tenor API format
    } else {
      console.error('Invalid GIF object structure:', gif);
      setError('Failed to load GIF: No valid URL found');
      setIsOpen(false);
      onClose();
      return;
    }

    // Add a visual indication of selection
    const button = document.querySelector(
      `.gpr-btn img[src="${gifUrl}"]`
    )?.parentElement;
    if (button) {
      button.classList.add('gif-selected');
    }

    onGifSelect(gifUrl);
    setIsOpen(false);
    onClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  // Add error handling for Tenor API requests
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const clonedResponse = response.clone();
      const responseBody = await clonedResponse.text();
      if (!response.ok) {
        console.error(`Tenor API Error (${response.status}):`, responseBody);
        setError(`Failed to load GIFs: ${responseBody}`);
      } else {
        console.log(`Tenor API Success (${args[0]}):`, responseBody);
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!isOpen) return null;

  if (error) {
    return (
      <div
        style={{
          position: 'absolute',
          zIndex: 1000,
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '5px',
          padding: '10px',
          color: 'red',
        }}
      >
        {error}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ×
        </button>
      </div>
    );
  }

  if (!tenorApiKey) {
    console.error('Tenor API key is not defined');
    return (
      <div
        style={{
          position: 'absolute',
          zIndex: 1000,
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '5px',
          padding: '10px',
          color: 'red',
        }}
      >
        Error: Tenor API key is missing
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div
      className="gif-picker-modal"
      style={{
        position: 'absolute',
        zIndex: 1000,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ×
        </button>
        <GifPicker
          tenorApiKey={tenorApiKey}
          clientKey={clientKey}
          onGifClick={handleGifClick}
          width={300}
          height={400}
          contentFilter="medium"
        />
      </div>
    </div>
  );
}
