import { Schema, model, Document } from 'mongoose';
import type Ajv from "ajv";

export interface IMessage extends Document {
  room: string; // room name
  user: string; // username
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  room: { type: String, required: true },
  user: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default model<IMessage>('Message', MessageSchema);

export type ClientMessage =
  | { type: "auth"; ts: number; nonce: string; payload: { token: string }; traceId?: string }
  | { type: "join_room"; ts: number; nonce: string; payload: { roomId: string }; traceId?: string }
  | { type: "leave_room"; ts: number; nonce: string; payload: { roomId: string }; traceId?: string }
  | { type: "send_message"; ts: number; nonce: string; payload: { roomId: string; text: string }; traceId?: string }
  | { type: "typing"; ts: number; nonce: string; payload: { roomId: string; isTyping: boolean }; traceId?: string }
  | { type: "ping"; ts: number; nonce: string; payload: {}; traceId?: string };

export function createMessageValidator(ajv: Ajv) {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["type", "ts", "nonce", "payload"],
    properties: {
      type: { enum: ["auth", "join_room", "leave_room", "send_message", "typing", "ping"] },
      ts: { type: "integer", minimum: 0 },
      nonce: { type: "string", minLength: 8, maxLength: 64 },
      traceId: { type: "string", minLength: 3, maxLength: 128, nullable: true },
      payload: {
        oneOf: [
          { type: "object", additionalProperties: false, required: ["token"], properties: { token: { type: "string", minLength: 10 } } },
          { type: "object", additionalProperties: false, required: ["roomId"], properties: { roomId: { type: "string", minLength: 1, maxLength: 64 } } },
          { type: "object", additionalProperties: false, required: ["roomId"], properties: { roomId: { type: "string", minLength: 1, maxLength: 64 } } },
          { type: "object", additionalProperties: false, required: ["roomId", "text"], properties: {
            roomId: { type: "string", minLength: 1, maxLength: 64 },
            text: { type: "string", minLength: 1, maxLength: 4000 }
          } },
          { type: "object", additionalProperties: false, required: ["roomId", "isTyping"], properties: {
            roomId: { type: "string", minLength: 1, maxLength: 64 },
            isTyping: { type: "boolean" }
          } },
          { type: "object", additionalProperties: false, properties: {} }
        ]
      }
    },
    allOf: [
      { if: { properties: { type: { const: "auth" } } }, then: { properties: { payload: { required: ["token"] } } } },
      { if: { properties: { type: { const: "join_room" } } }, then: { properties: { payload: { required: ["roomId"] } } } },
      { if: { properties: { type: { const: "leave_room" } } }, then: { properties: { payload: { required: ["roomId"] } } } },
      { if: { properties: { type: { const: "send_message" } } }, then: { properties: { payload: { required: ["roomId", "text"] } } } },
      { if: { properties: { type: { const: "typing" } } }, then: { properties: { payload: { required: ["roomId", "isTyping"] } } } },
    ]
  } as const;

  return ajv.compile(schema);
}
