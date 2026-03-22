import React from 'react';

export function KarmaFeedback({ delta, positive }) {
    return React.createElement('div', { className: `karma-feedback ${positive ? 'positive' : 'negative'}` },
        `${delta > 0 ? "+" : ""}${delta} Karma`
    );
}