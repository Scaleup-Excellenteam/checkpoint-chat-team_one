import { TestAgent, TestRunner } from './test-setup';
import { faker } from '@faker-js/faker';

// --- Test Configuration ---
const NUMBER_OF_AGENTS = 3;
const ROOM_NAME = "automated-test-room";
const MESSAGES_PER_AGENT = 2;

/**
 * A simple delay utility to make the conversation flow more realistic.
 * @param ms - Milliseconds to wait.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Defines the test scenario logic.
 */
async function chatRoomScenario(agents: TestAgent[]): Promise<void> {
    if (agents.length === 0) {
        throw new Error("No agents created for the test.");
    }

    // 1. All agents register
    console.log("\n--- Step 1: Agent Registration ---");
    for (const agent of agents) {
        await agent.register();
        await delay(200); // Stagger registrations
    }

    // 2. The first agent creates a room
    console.log("\n--- Step 2: Room Creation ---");
    const roomCreator = agents[0];
    await roomCreator.createRoom(ROOM_NAME);
    await delay(500);

    // 3. All agents send messages to the room
    console.log("\n--- Step 3: Messaging ---");
    for (let i = 0; i < MESSAGES_PER_AGENT; i++) {
        for (const agent of agents) {
            const message = faker.lorem.sentence();
            await agent.sendMessage(ROOM_NAME, message);
            await delay(300); // Stagger messages
        }
    }
}

/**
 * Main execution block.
 */
(async () => {
    const runner = new TestRunner();
    runner.createAgents(NUMBER_OF_AGENTS);
    await runner.run(chatRoomScenario);
})();
