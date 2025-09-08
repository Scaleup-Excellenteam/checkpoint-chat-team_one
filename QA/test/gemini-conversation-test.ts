// A simple helper function to create a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

console.log("--- Loading gemini-conversation-test.ts script ---");

import { TestRunner, TestAgent } from './test-setup';

/**
 * This test scenario simulates a full, dynamic conversation between multiple AI agents.
 */
async function geminiConversationScenario(agents: TestAgent[]): Promise<void> {
    if (agents.length < 2) {
        throw new Error("This scenario requires at least 2 agents to have a conversation.");
    }

    console.log("\n--- Step 1: Agent Registration ---");
    await Promise.all(agents.map(agent => agent.register()));

    console.log("\n--- Step 2: Room Creation ---");
    const roomCreator = agents[0];
    const createdRoom = await roomCreator.createRoom("discussion-room222");
    if (!createdRoom || !createdRoom._id) {
        throw new Error("Failed to create a room or room ID is missing.");
    }
    const roomId = createdRoom._id;

    const conversationTopic = "the future of renewable energy sources";
    console.log(`\n--- Starting conversation on: "${conversationTopic}" ---`);

    // We'll have a longer conversation to test the rate limiting fix
    const conversationTurns = 20; 
    for (let i = 0; i < conversationTurns; i++) {
        const currentAgent = agents[i % agents.length];
        await currentAgent.generateAndSendMessage(roomId, conversationTopic);

        // --- ADDED: A 1500ms delay to avoid hitting API rate limits ---
        await delay(1500);
    }
}

// --- Test Execution ---
try {
    console.log("--- Initializing test runner ---");
    const runner = new TestRunner();
    runner.createAgents(20); // Let's use 5 agents for a good conversation flow
    runner.run(geminiConversationScenario).catch(err => {
        console.error("FATAL: Unhandled error in test runner execution:", err);
        process.exit(1);
    });
} catch (error) {
    console.error("FATAL: An error occurred during initial test setup:", error);
    process.exit(1);
}

