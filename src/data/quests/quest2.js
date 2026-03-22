export const quest2 = {
    id: 'q2',
    title: "Mrs. Gino's Letter",
    giver: 'mrsGino',
    steps: [
        { target: 'postoffice', action: 'POST_LETTER', text: 'Post the letter' },
        { target: 'mrsGino', action: 'RETURN', text: 'Return to Mrs. Gino' }
    ],
    reward: { karma: 0, money: 2 }
};