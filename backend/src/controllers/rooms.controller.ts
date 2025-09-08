import { Request, Response, NextFunction } from 'express';
import * as roomServices from '../services/rooms.services';

// standardize response format
const handleResponse = (res: Response, status: number, message: string, data: any = null) => {
    res.status(status).json({
        status,
        message,
        data
    });
};

export const getAllRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await roomServices.getAllRoomsService();
    handleResponse(res, 200, 'Rooms fetched successfully', rooms);
  } catch (error) {
    next(error);
  }
};

export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, username } = req.body;
    const newRoom = await roomServices.createRoomService(name, username);
    handleResponse(res, 201, 'Room created successfully', newRoom);
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomName } = req.params;
    const { username } = req.body; // Assuming username for auth comes from body
    await roomServices.deleteRoomService(roomName, username);
    handleResponse(res, 200, 'Room deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getRoomByName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomName } = req.params;
    const room = await roomServices.getRoomByNameService(roomName);
    if (!room) {
        return handleResponse(res, 404, 'Room not found');
    }
    handleResponse(res, 200, 'Room fetched successfully', room);
  } catch (error) {
    next(error);
  }
};

export const joinRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { roomName } = req.params;
        const { username } = req.body;
        const room = await roomServices.joinRoomService(roomName, username);
        handleResponse(res, 200, 'User joined room successfully', room);
    } catch (error) {
        next(error);
    }
};

export const getMessagesForRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { roomName } = req.params;
        const { username } = req.query;
        if (typeof username !== 'string') {
            return handleResponse(res, 400, 'Username query parameter is required');
        }
        const messages = await roomServices.getMessagesForRoomService(roomName, username);
        handleResponse(res, 200, 'Messages fetched successfully', messages);
    } catch (error) {
        next(error);
    }
};

export const sendMessageToRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { roomName } = req.params;
        const { username, content } = req.body;
        const message = await roomServices.sendMessageToRoomService(roomName, username, content);
        handleResponse(res, 201, 'Message sent successfully', message);
    } catch (error) {
        next(error);
    }
};

export const updateRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { roomName } = req.params;
        const updates = req.body;
        const updatedRoom = await roomServices.updateRoomService(roomName, updates);
        handleResponse(res, 200, 'Room updated successfully', updatedRoom);
    } catch (error) {
        next(error);
    }
};