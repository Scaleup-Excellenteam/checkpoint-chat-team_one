import { Router } from 'express';
import { createRoom, getRoomById, updateRoom, deleteRoom, getAllRooms } from '../controllers/rooms.controller';

const router = Router();


// get all rooms
router.get('/', getAllRooms);

// Create a new room
router.post('/', createRoom); // this is POST /rooms 

// Get a room by ID
router.get('/:id', getRoomById);

// Update a room by ID
router.put('/:id', updateRoom);

// Delete a room by ID
router.delete('/:id', deleteRoom);



export default router;