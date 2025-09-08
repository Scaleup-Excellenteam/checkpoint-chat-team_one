import { Request, Response, NextFunction } from "express";
import Message from "../schemas/messages.schema";
import { getMessagesService } from "../services/messages.service";

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
    const { body } = req.body;
  try {
    const messages = await getMessagesService(body);
    res.status(200).json(messages);
  } catch (error) {

  }
};

export const pushMessage = async (req: Request, res: Response, next: NextFunction) => {
    const { body } = req;
  try {
    const message = new Message(body);
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};
