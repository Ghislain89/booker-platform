import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRouter from './routes/auth';
import roomsRouter from './routes/rooms';
import bookingsRouter from './routes/bookings';
import messagesRouter from './routes/messages';
import reportsRouter from './routes/reports';
import brandingRouter from './routes/branding';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Download Swagger JSON
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=swagger.json');
  res.send(JSON.stringify(swaggerSpec, null, 2));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/branding', brandingRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// Start server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
    console.log(`Swagger JSON available at http://localhost:${port}/swagger.json`);
  });
}

export default app; 