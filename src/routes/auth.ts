import express from 'express';
import { AuthRequest, AuthResponse, RegisterRequest, ApiResponse } from '../types';
import { authController } from '../controllers/auth';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [ROLE_USER, ROLE_ADMIN]
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const credentials: AuthRequest = req.body;
    const response = await authController.login(credentials);
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 example: newuser
 *               password:
 *                 type: string
 *                 example: password123
 *               email:
 *                 type: string
 *                 example: newuser@example.com
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [ROLE_USER]
 *       400:
 *         description: Username already exists
 */
router.post('/register', async (req, res) => {
  console.log("\n=== Register Route Handler ===");
  console.log("Received request body:", JSON.stringify(req.body, null, 2));

  try {
    const userData: RegisterRequest = req.body;
    console.log("Calling auth controller register...");
    const response = await authController.register(userData);
    console.log("Auth controller returned:", JSON.stringify(response, null, 2));

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.log("Error in register route:", error);
    res.status(400).json({
      success: false,
      error: "Username already exists",
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', async (req, res) => {
  try {
    await authController.logout(req);
    res.json({
      success: true
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
});

export default router; 