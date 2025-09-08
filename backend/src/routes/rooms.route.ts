import { Router } from 'express';

const router = Router();
import { createRoom, getRoomByName, updateRoom, deleteRoom, getAllRooms, joinRoom } from '../controllers/rooms.controller';

// Join a room
router.post('/:roomName/join', joinRoom);


// get all rooms
router.get('/', getAllRooms);

// Create a new room
router.post('/', createRoom); // this is POST /rooms 

// Get a room by name
router.get('/:roomName', getRoomByName);

// Update a room by name
router.put('/:roomName', updateRoom);

// Delete a room by name
router.delete('/:roomName', deleteRoom);



export default router;