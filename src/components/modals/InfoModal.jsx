import React from 'react';

export function InfoModal({ text, onClose }) {
    return React.createElement('div', { className: "modal-overlay", onClick: onClose },
        React.createElement('div', { className: "modal", onClick: e => e.stopPropagation() },
            React.createElement('div', { className: "dialogue-text" }, text),
            React.createElement('div', { className: "close-btn", onClick: onClose }, "OK")
        )
    );
}