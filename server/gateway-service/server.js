
import app from './src/app.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Gateway running on ${PORT}`));
