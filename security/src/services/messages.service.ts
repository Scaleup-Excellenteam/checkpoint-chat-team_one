import Message from "../schemas/messages.schema";

export const getMessagesService = async (body: any) => {
    return Message.find(body);
};



