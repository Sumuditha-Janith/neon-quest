import React from 'react';

export function InventoryModal({ inventory, onClose }) {
    return React.createElement('div', { className: "modal-overlay", onClick: onClose },
        React.createElement('div', { className: "modal", onClick: e => e.stopPropagation() },
            React.createElement('h3', null, "🎒 Inventory"),
            inventory.length === 0 ?
                React.createElement('div', { style: { padding: '30px', textAlign: 'center', color: '#777' } }, "Empty") :
                inventory.map((it, i) =>
                    React.createElement('div', { key: i, className: "inventory-item-modal" },
                        it.name + (it.price ? ` ($${it.price})` : '')
                    )
                ),
            React.createElement('div', { className: "close-btn", onClick: onClose }, "Close")
        )
    );
}