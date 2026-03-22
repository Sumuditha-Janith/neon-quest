import React from 'react';

export function LeftPanel({ money, karma, inventory, onOpenInventory }) {
    const getKarmaLabel = () => {
        if (karma >= 66) return "Good 😇";
        if (karma <= 34) return "Evil 😈";
        return "Neutral 😐";
    };

    const karmaColor = karma >= 66 ? "#4caf50" : karma <= 34 ? "#e74c3c" : "#f5b042";

    return React.createElement('div', { className: "left-panel" },
        React.createElement('div', { className: "stat-card" },
            React.createElement('div', { className: "stat-title" }, "❤️ HEALTH"),
            React.createElement('div', { className: "health-bar" },
                React.createElement('div', { className: "health-fill" })
            )
        ),
        React.createElement('div', { className: "stat-card" },
            React.createElement('div', { className: "stat-title" }, "⚖️ KARMA"),
            React.createElement('div', { className: "karma-bar" },
                React.createElement('div', { className: "karma-fill", style: { width: `${karma}%`, background: karmaColor } })
            ),
            React.createElement('div', { className: "stat-value", style: { marginTop: '8px' } }, getKarmaLabel())
        ),
        React.createElement('div', { className: "stat-card" },
            React.createElement('div', { className: "stat-title" }, "💰 MONEY"),
            React.createElement('div', { className: "stat-value" }, `$${money}`)
        ),
        React.createElement('div', { className: "stat-card" },
            React.createElement('div', { className: "stat-title" }, "📦 INVENTORY"),
            React.createElement('div', { className: "inventory-list" },
                inventory.length === 0 ? "Empty" : inventory.map((it, i) =>
                    React.createElement('div', { key: i, className: "inventory-item" },
                        it.name + (it.price ? ` ($${it.price})` : '')
                    )
                )
            ),
            React.createElement('div', { className: "inventory-btn", onClick: onOpenInventory }, "Open Inventory")
        )
    );
}