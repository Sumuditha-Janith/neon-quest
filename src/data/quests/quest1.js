export const quest1 = {
    id: 'q1',
    title: "Gino's Hunger",
    giver: 'npc',
    steps: [
        { target: 'shop', action: 'BUY_PIZZA', text: 'Visit Mario\'s' },
        { target: 'npc', action: 'DELIVER', text: 'Return to Gino' }
    ],
    reward: { karma: 10, money: 5 }
};