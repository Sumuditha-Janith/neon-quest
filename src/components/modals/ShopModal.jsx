import React from 'react';

const PIZZA_MENU = [
    { name: "Veggie Pizza", price: 10, id: "veggie" },
    { name: "Pepperoni Pizza", price: 12, id: "pepperoni" },
    { name: "BBQ Chicken Pizza", price: 15, id: "bbq" }
];

export function ShopModal({ money, onBuy, onClose }) {
    return React.createElement('div', { className: "modal-overlay", onClick: onClose },
        React.createElement('div', { className: "modal", onClick: e => e.stopPropagation() },
            React.createElement('h3', null, "🍕 Mario's Pizza"),
            React.createElement('div', { style: { marginBottom: '14px' } }, `Money: $${money}`),
            PIZZA_MENU.map(p => 
                React.createElement('div', { key: p.id, className: "pizza-option", onClick: () => onBuy(p) },
                    `${p.name} — $${p.price}`
                )
            ),
            React.createElement('div', { className: "close-btn", onClick: onClose }, "Cancel")
        )
    );
}