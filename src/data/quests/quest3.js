export const quest3 = {
    id: 'q3',
    title: "Tommy's Factory",
    giver: 'tommy',
    steps: [
        { target: 'factory', action: 'USE_LOCK', text: 'Lock the factory door' },
        { target: 'tommy', action: 'RETURN', text: 'Return to Tommy' }
    ],
    reward: { karma: 0, money: 0 },
    optionalReward: { item: 'cigarette', name: 'Premium Cigarette' }
};