export class QuestManager {
    constructor(allQuests, onGameStateUpdate) {
        this.quests = allQuests;
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.playerState = { inventory: [], money: 0, flags: {} };
        this.onGameStateUpdate = onGameStateUpdate;
    }

    updatePlayerState(newState) {
        this.playerState = { ...this.playerState, ...newState };
        this.checkQuestProgress();
    }

   
    getDialogueForTarget(targetId) {
        // 1. Check completed quests for post-completion text
        for (const quest of this.quests) {
            if (quest.giver === targetId && this.completedQuests.has(quest.id)) {
                // Special case for Gino before Q2 starts
                if (quest.id === 'q1' && !this.completedQuests.has('q2') && !this.activeQuests.has('q2')) {
                    return { text: quest.postCompletionText, options: [{ text: "I'll go see her", action: { type: "CLOSE" } }] };
                }
                return { text: quest.postCompletionText || "Life is good!", options: [{ text: "Bye", action: { type: "CLOSE" } }] };
            }
        }

        // 2. Check active quests
        for (const [questId, quest] of this.activeQuests) {
            if (quest.giver === targetId) {
                const currentStep = quest.steps[quest.currentStep];
                
                // ✨ FIX EKA METHANAI ✨
                // Player inna step eka anthima step eka nam saha target eka me NPC nam, quest eka iwarai!
                if (currentStep && quest.currentStep === quest.steps.length - 1 && currentStep.target === targetId) {
                    return this._getCompletionDialogue(quest);
                }
                
                // Quest is active but not complete
                return { text: quest.activeDialogue.text, options: quest.activeDialogue.options };
            }
        }

        // 3. Check for new quests
        const availableQuest = this.quests.find(q => q.giver === targetId);
        if (availableQuest) {
            if (!availableQuest.prerequisite || this.completedQuests.has(availableQuest.prerequisite)) {
                return availableQuest.startDialogue;
            } else {
                return { text: availableQuest.busyText, options: [{ text: "Okay", action: { type: "CLOSE" } }] };
            }
        }

        return null;
    }

    // Custom logic for Pizza math!
    _getCompletionDialogue(quest) {
        if (quest.id === 'q1') {
            const pizza = this.playerState.inventory.find(i => i.id === 'pizza');
            if (!pizza) return null;
            
            if (pizza.price === 15) {
                return { text: `Gino: 'Wow! ${pizza.name}? Premium! Thanks!'`, options: [{ text: "Enjoy!", action: { type: "COMPLETE_Q1", karma: 0, cost: 0 } }] };
            } else {
                const changeLeft = 15 - pizza.price;
                return { text: `Gino: 'Ah, ${pizza.name}. Any change from $15?'`, options: [
                    { text: `✅ Return $${changeLeft}`, action: { type: "COMPLETE_Q1", karma: 10, cost: changeLeft } },
                    { text: `❌ Lie: 'No change!'`, action: { type: "COMPLETE_Q1", karma: -20, cost: 0 } }
                ]};
            }
        }
        return quest.completionDialogue;
    }

    handleAction(action) {


        if (!action || action.type === 'CLOSE') return;

        if (action.giveItem) this.onGameStateUpdate({ type: 'ADD_ITEM', item: action.giveItem });
        if (action.rewardMoney) this.onGameStateUpdate({ type: 'UPDATE_MONEY', amount: action.rewardMoney });
        if (action.karma) this.onGameStateUpdate({ type: 'UPDATE_KARMA', amount: action.karma });

        switch (action.type) {
            case 'START_Q1':
                this.onGameStateUpdate({ type: 'UPDATE_MONEY', amount: 15 });
                this._startQuest('q1');
                break;
            case 'START_QUEST':
                this._startQuest(action.questId);
                break;
            case 'COMPLETE_Q1':
                if (action.cost > 0) this.onGameStateUpdate({ type: 'UPDATE_MONEY', amount: -action.cost });
                this.onGameStateUpdate({ type: 'REMOVE_ITEM', itemId: 'pizza' });
                this._completeQuest('q1');
                break;
            case 'COMPLETE_QUEST':
                this._completeQuest(action.questId);
                break;
        }
    }

    

    _startQuest(questId) {
        const quest = this.quests.find(q => q.id === questId);
        if (quest) {
            this.activeQuests.set(questId, { ...quest, currentStep: 0 });
            this.onGameStateUpdate({ type: 'QUEST_UPDATE' });
        }
    }

    _completeQuest(questId) {
        if (this.activeQuests.has(questId)) {
            this.activeQuests.delete(questId);
            this.completedQuests.add(questId);
            this.onGameStateUpdate({ type: 'QUEST_UPDATE' });
        }
    }

    checkQuestProgress() {
        for (const [questId, quest] of this.activeQuests) {
            const currentStep = quest.steps[quest.currentStep];
            if (currentStep && currentStep.condition && this._evaluateCondition(currentStep.condition)) {
                quest.currentStep++;
                this.onGameStateUpdate({ type: 'QUEST_UPDATE' });
            }
        }
    }

    _evaluateCondition(condition) {
        if (!condition) return true;
        if (condition.type === 'HAS_ITEM') return this.playerState.inventory.some(i => i.id === condition.itemId);
        if (condition.type === 'FLAG_TRUE') return this.playerState.flags[condition.flagId] === true;
        return false;
    }
}