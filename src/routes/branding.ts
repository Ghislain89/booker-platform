import express from 'express';
import { Branding } from '../types';
import { brandingController } from '../controllers/branding';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/branding:
 *   get:
 *     summary: Get branding settings
 *     tags: [Branding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branding settings
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
 *                     hotelName:
 *                       type: string
 *                     logo:
 *                       type: string
 *                     primaryColor:
 *                       type: string
 *                     secondaryColor:
 *                       type: string
 *                     fontFamily:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const branding = await brandingController.getSettings();
    res.json({
      success: true,
      data: branding
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch branding settings'
    });
  }
});

/**
 * @swagger
 * /api/branding:
 *   put:
 *     summary: Update branding settings (admin only)
 *     tags: [Branding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hotelName:
 *                 type: string
 *                 example: "Grand Hotel"
 *               logo:
 *                 type: string
 *                 example: "https://example.com/logo.png"
 *               primaryColor:
 *                 type: string
 *                 example: "#FF5733"
 *               secondaryColor:
 *                 type: string
 *                 example: "#33FF57"
 *               fontFamily:
 *                 type: string
 *                 example: "Arial, sans-serif"
 *     responses:
 *       200:
 *         description: Branding settings updated successfully
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
 *                     hotelName:
 *                       type: string
 *                     logo:
 *                       type: string
 *                     primaryColor:
 *                       type: string
 *                     secondaryColor:
 *                       type: string
 *                     fontFamily:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden - Admin access required
 *       401:
 *         description: Unauthorized
 */
router.put('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const branding = await brandingController.updateSettings(req.body);
    res.json({
      success: true,
      data: branding
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update branding settings'
    });
  }
});

/**
 * @swagger
 * /api/branding/reset:
 *   post:
 *     summary: Reset branding settings to default (admin only)
 *     tags: [Branding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branding settings reset successfully
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
 *                     hotelName:
 *                       type: string
 *                     logo:
 *                       type: string
 *                     primaryColor:
 *                       type: string
 *                     secondaryColor:
 *                       type: string
 *                     fontFamily:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden - Admin access required
 *       401:
 *         description: Unauthorized
 */
router.post('/reset', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const branding = await brandingController.resetSettings();
    res.json({
      success: true,
      data: branding
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to reset branding settings'
    });
  }
});

export default router; 