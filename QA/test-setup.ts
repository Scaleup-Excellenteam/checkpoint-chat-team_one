import axios, { AxiosInstance } from 'axios';
import { faker } from '@faker-js/faker';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:50000/api';

/**
 * Represents a single testing agent that can interact with the API.
 */
export class TestAgent {
    public readonly username: string;
    public readonly email: string;
    private readonly password = 'password123';
    private api: AxiosInstance;
    private token: string | null = null;

    constructor() {
        this.username = faker.internet.username().toLowerCase().replace(/[^a-z0-9_]/g, "_");
        this.email = faker.internet.email().toLowerCase();
        this.api = axios.create({ baseURL: API_BASE_URL });
    }

    /**
     * Registers the agent and automatically logs them in.
     */
    async register(): Promise<void> {
        try {
            const response = await this.api.post('/auth/register', {
                username: this.username,
                email: this.email,
                password: this.password,
            });
            this.token = response.data.token;
            this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
            console.log(`✅ Agent ${this.username} registered and logged in.`);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`❌ Agent ${this.username} failed to register:`, error.response?.data || error.message);
            } else if (error instanceof Error) {
                console.error(`❌ Agent ${this.username} failed to register:`, error.message);
            } else {
                 console.error(`❌ Agent ${this.username} failed to register with an unknown error.`);
            }
            throw error; // Re-throw the error to fail the test
        }
    }

    /**
     * Creates a new chat room.
     * @param roomName - The name of the room to create.
     */
    async createRoom(roomName: string): Promise<void> {
        try {
            await this.api.post('/rooms', { name: roomName, username: this.username });
            console.log(`✅ Agent ${this.username} created room "${roomName}".`);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`❌ Agent ${this.username} failed to create room:`, error.response?.data || error.message);
            } else if (error instanceof Error) {
                console.error(`❌ Agent ${this.username} failed to create room:`, error.message);
            } else {
                console.error(`❌ Agent ${this.username} failed to create room with an unknown error.`);
            }
            throw error; // Re-throw the error to fail the test
        }
    }

    /**
     * Sends a message to a specific room.
     * @param roomName - The name of the room.
     * @param content - The message content.
     */
    async sendMessage(roomName: string, content: string): Promise<void> {
        try {
            await this.api.post(`/rooms/${roomName}/messages`, {
                username: this.username,
                content: content,
            });
            console.log(`✉️  Agent ${this.username} sent message to "${roomName}": "${content}"`);
        } catch (error) {
             if (axios.isAxiosError(error)) {
                console.error(`❌ Agent ${this.username} failed to send message:`, error.response?.data || error.message);
            } else if (error instanceof Error) {
                console.error(`❌ Agent ${this.username} failed to send message:`, error.message);
            } else {
                 console.error(`❌ Agent ${this.username} failed to send message with an unknown error.`);
            }
            throw error; // Re-throw the error to fail the test
        }
    }
}


/**
 * Manages the overall test execution.
 */
export class TestRunner {
    private agents: TestAgent[] = [];

    /**
     * Creates a specified number of test agents.
     * @param count - The number of agents to create.
     */
    createAgents(count: number): void {
        for (let i = 0; i < count; i++) {
            this.agents.push(new TestAgent());
        }
        console.log(`🤖 Created ${count} test agents.`);
    }

    /**
     * Runs a given test scenario with the created agents.
     * @param scenario - An async function defining the test steps.
     */
    async run(scenario: (agents: TestAgent[]) => Promise<void>): Promise<void> {
        try {
            // ** NEW: Health check before running the test **
            console.log("🩺 Checking server health...");
            await axios.get(`${API_BASE_URL}/health`);
            console.log("✅ Server is healthy.");

            console.log("\n🚀 Starting test scenario...");
            await scenario(this.agents);
            console.log("\n✅ Test scenario completed successfully.");
        } catch (error) {
            if (axios.isAxiosError(error) && error.config?.url?.includes('/health')) {
                console.error("❌ Test setup failed: Could not connect to the server. Is it running?");
            } else if (error instanceof Error) {
                console.error("❌ Test scenario failed:", error.message);
            } else {
                console.error("❌ Test scenario failed with an unknown error.");
            }
            process.exit(1); // Exit with an error code
        }
    }
}

