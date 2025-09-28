import 'dotenv/config';
import { DatabaseConfig } from '../config/postgres.config';

export default DatabaseConfig.createDataSource();
