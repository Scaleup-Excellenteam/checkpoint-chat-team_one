import axios, { AxiosInstance } from 'axios';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { TestLogger } from '../config/logger';
import { generateAiChatMessage } from '../services/gemini-service';

// Load environment variables.
// By default, dotenv looks for the .env file in the current working directory.
dotenv.config();

// --- Configuration ---
const API_HOST = process.env.API_HOST ;
const API_PORT = process.env.API_PORT || '5000';
const API_BASE_URL = `${API_HOST}:${API_PORT}`;
const healthCheckUrl = `${API_BASE_URL}/api/health`;

/**
 * Represents a single testing agent that can interact with the API.
 */
export class TestAgent {
    public readonly username: string;
    public readonly email: string;
    public id: string | null = null;
    private readonly password = 'password123';
    private api: AxiosInstance;
    private token: string | null = null;
    private logger: TestLogger;

    constructor(logger: TestLogger) {
        this.logger = logger;
        this.username = faker.internet.username().toLowerCase().replace(/[^a-z0-9_]/g, "_");
        this.email = faker.internet.email().toLowerCase();
        this.api = axios.create({ baseURL: API_BASE_URL });
    }

    async register(): Promise<void> {
        try {
            const response = await this.api.post('/auth/register', {
                username: this.username,
                email: this.email,
                password: this.password,
            });
            this.token = response.data.token;
            this.id = response.data.user.id;
            this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
            this.logger.log(`✅ Agent ${this.username} (ID: ${this.id}) registered and logged in.`);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.logger.log(`❌ Agent ${this.username} failed to register: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    async createRoom(roomName: string): Promise<any> {
        try {
            const response = await this.api.post('/rooms', { name: roomName, username: this.username });
            this.logger.log(`✅ Agent ${this.username} created room "${roomName}".`);
            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.logger.log(`❌ Agent ${this.username} failed to create room: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    
    async sendMessage(roomId: string, content: string): Promise<void> {
        try {
            await this.api.post('/messages', {
                room: roomId,
                user: this.id,
                content: content,
            });
            this.logger.log(`✉️  Agent ${this.username} sent message: "${content}"`);
        } catch (error) {
             if (axios.isAxiosError(error)) {
                this.logger.log(`❌ Agent ${this.username} failed to send message: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    async getMessagesForRoom(roomId: string): Promise<any[]> {
        try {
            const response = await this.api.get(`/messages/room/${roomId}`);
            this.logger.log(`🔎 Agent ${this.username} fetched messages for room ${roomId}.`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                 this.logger.log(`❌ Agent ${this.username} failed to fetch messages: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    async generateAndSendMessage(roomId: string, topic: string): Promise<void> {
        const history = await this.getMessagesForRoom(roomId);
        const newMessageContent = await generateAiChatMessage(topic, history);
        await this.sendMessage(roomId, newMessageContent);
    }
}

/**
 * Manages the overall test execution.
 */
export class TestRunner {
    private agents: TestAgent[] = [];
    private logger: TestLogger;

    constructor() {
        this.logger = new TestLogger();
    }

    createAgents(count: number): void {
        for (let i = 0; i < count; i++) {
            this.agents.push(new TestAgent(this.logger));
        }
        this.logger.log(`🤖 Created ${count} test agents.`);
    }

    async run(scenario: (agents: TestAgent[]) => Promise<void>): Promise<void> {
        try {
            this.logger.log("🩺 Checking server health...");
            await axios.get(healthCheckUrl);
            this.logger.log("✅ Server is healthy.");

            this.logger.log("\n🚀 Starting test scenario...");
            await scenario(this.agents);
            this.logger.log("\n✅ Test scenario completed successfully.");
        } catch (error) {
            if (axios.isAxiosError(error) && error.config?.url?.includes(healthCheckUrl)) {
                this.logger.log("❌ Test setup failed: Could not connect to the server. Is it running?");
            } else if (axios.isAxiosError(error)) {
                this.logger.log(`❌ Test scenario failed: ${error.message}`);
            } else {
                this.logger.log(`❌ Test scenario failed with an unknown error.`);
            }
            process.exit(1);
        }
    }
}

