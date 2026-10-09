import express from 'express';
import { Room } from '../types';
import { roomsController } from '../controllers/rooms';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       number:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [STANDARD, DELUXE, SUITE]
 *                       price:
 *                         type: number
 *                       capacity:
 *                         type: number
 *                       amenities:
 *                         type: array
 *                         items:
 *                           type: string
 *                       status:
 *                         type: string
 *                         enum: [AVAILABLE, OCCUPIED, MAINTENANCE]
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const rooms = await roomsController.getAll();
    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rooms'
    });
  }
});

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     number:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [STANDARD, DELUXE, SUITE]
 *                     price:
 *                       type: number
 *                     capacity:
 *                       type: number
 *                     amenities:
 *                       type: array
 *                       items:
 *                         type: string
 *                     status:
 *                       type: string
 *                       enum: [AVAILABLE, OCCUPIED, MAINTENANCE]
 *       404:
 *         description: Room not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const room = await roomsController.getById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch room'
    });
  }
});

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create new room (admin only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - type
 *               - price
 *               - capacity
 *             properties:
 *               number:
 *                 type: string
 *                 example: "101"
 *               type:
 *                 type: string
 *                 enum: [STANDARD, DELUXE, SUITE]
 *                 example: "STANDARD"
 *               price:
 *                 type: number
 *                 example: 100
 *               capacity:
 *                 type: number
 *                 example: 2
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["WiFi", "TV"]
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     number:
 *                       type: string
 *                     type:
 *                       type: string
 *                     price:
 *                       type: number
 *                     capacity:
 *                       type: number
 *                     amenities:
 *                       type: array
 *                       items:
 *                         type: string
 *                     status:
 *                       type: string
 *       403:
 *         description: Forbidden - Admin access required
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const room = await roomsController.create(req.body);
    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create room'
    });
  }
});

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Update room (admin only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [STANDARD, DELUXE, SUITE]
 *               price:
 *                 type: number
 *               capacity:
 *                 type: number
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, OCCUPIED, MAINTENANCE]
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     number:
 *                       type: string
 *                     type:
 *                       type: string
 *                     price:
 *                       type: number
 *                     capacity:
 *                       type: number
 *                     amenities:
 *                       type: array
 *                       items:
 *                         type: string
 *                     status:
 *                       type: string
 *       404:
 *         description: Room not found
 *       403:
 *         description: Forbidden - Admin access required
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const room = await roomsController.update(req.params.id, req.body);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update room'
    });
  }
});

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Delete room (admin only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Room not found
 *       403:
 *         description: Forbidden - Admin access required
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const success = await roomsController.delete(req.params.id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete room'
    });
  }
});

export default router; 