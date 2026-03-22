import React from 'react';

export function RightPanel({ objectiveText, interactHint }) {
    return React.createElement('div', { className: "right-panel" },
        React.createElement('div', { className: "objective-box" },
            React.createElement('div', { className: "objective-title" }, "📍 CURRENT OBJECTIVE"),
            React.createElement('div', { className: "objective-text" }, objectiveText)
        ),
        React.createElement('div', { className: "info-area" },
            React.createElement('div', { className: "interact-hint-static" }, interactHint || "✨ Explore the world"),
            React.createElement('div', { className: "controls-tip-static" }, "WASD Move • E Interact • ↑↓ Enter (dialogue)")
        )
    );
}