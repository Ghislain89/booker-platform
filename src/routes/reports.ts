import express from 'express';
import { Report } from '../types';
import { reportsController } from '../controllers/reports';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reports
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
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [OCCUPANCY, REVENUE, MAINTENANCE]
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
    const reports = await reportsController.getAll();
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get report by ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report details
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
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [OCCUPANCY, REVENUE, MAINTENANCE]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const report = await reportsController.getById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
});

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create new report (admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Monthly Occupancy Report"
 *               content:
 *                 type: string
 *                 example: "The hotel occupancy rate for March 2024 was 85%"
 *               type:
 *                 type: string
 *                 enum: [OCCUPANCY, REVENUE, MAINTENANCE]
 *                 example: "OCCUPANCY"
 *     responses:
 *       201:
 *         description: Report created successfully
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
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [OCCUPANCY, REVENUE, MAINTENANCE]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid report data
 *       403:
 *         description: Forbidden - Admin access required
 *       401:
 *         description: Unauthorized
 */
router.post('/generate', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { type, period } = req.body;
    const report = await reportsController.generateReport(type, period);
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Delete report (admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted successfully
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
 *         description: Report not found
 *       403:
 *         description: Forbidden - Admin access required
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const success = await reportsController.delete(req.params.id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete report'
    });
  }
});

export default router; 