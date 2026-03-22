import React from 'react';

export function DialogueModal({ text, options, selectedIndex, onSelect, onClose }) {
    return React.createElement('div', { className: "modal-overlay", onClick: onClose },
        React.createElement('div', { className: "modal", onClick: e => e.stopPropagation() },
            React.createElement('div', { className: "dialogue-text" }, text),
            options.map((opt, i) =>
                React.createElement('div', {
                    key: i,
                    className: `dialogue-option ${i === selectedIndex ? 'selected' : ''}`,
                    onClick: () => onSelect(opt)
                }, opt.text)
            )
        )
    );
}