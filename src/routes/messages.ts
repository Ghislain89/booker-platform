import express from 'express';
import { Message } from '../types';
import { messagesController } from '../controllers/messages';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get all messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of messages
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
 *                       userId:
 *                         type: string
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const messages = await messagesController.getAll();
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// Get user's messages
router.get('/my-messages', authenticate, async (req, res) => {
  try {
    const messages = await messagesController.getUserMessages(req.user!.userId);
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user messages'
    });
  }
});

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     summary: Get message by ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message details
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
 *                     userId:
 *                       type: string
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Message not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const message = await messagesController.getById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch message'
    });
  }
});

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Create new message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Hello, I have a question about my booking."
 *     responses:
 *       201:
 *         description: Message created successfully
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
 *                     userId:
 *                       type: string
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid message data
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const message = await messagesController.create({
      ...req.body,
      userId: req.user!.userId
    });
    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create message'
    });
  }
});

/**
 * @swagger
 * /api/messages/{id}:
 *   put:
 *     summary: Update message (admin only)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Updated message content"
 *     responses:
 *       200:
 *         description: Message updated successfully
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
 *                     content:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Message not found
 *       403:
 *         description: Forbidden - Admin access required
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const message = await messagesController.update(req.params.id, req.body);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update message'
    });
  }
});

/**
 * @swagger
 * /api/messages/{id}:
 *   delete:
 *     summary: Delete message (admin only)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
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
 *         description: Message not found
 *       403:
 *         description: Forbidden - Admin access required
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const success = await messagesController.delete(req.params.id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
});

export default router; 