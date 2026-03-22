import React from 'react';

export function ChoiceModal({ text, choices, onChoice, onClose }) {
    return React.createElement('div', { className: "modal-overlay", onClick: onClose },
        React.createElement('div', { className: "modal", onClick: e => e.stopPropagation() },
            React.createElement('div', { className: "dialogue-text" }, text),
            choices.map((c, i) =>
                React.createElement('div', { key: i, className: "quest-choice", onClick: () => onChoice(c) }, c.text)
            ),
            React.createElement('div', { className: "close-btn", onClick: onClose }, "Cancel")
        )
    );
}