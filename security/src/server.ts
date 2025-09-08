import app from './app';
import { PORT } from './config/env';

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default server;