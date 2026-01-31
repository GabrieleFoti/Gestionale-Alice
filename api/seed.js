import bcrypt from 'bcryptjs';
import { User } from './entities/user.js';
import { initDB } from './db.js';

const seed = async () => {
  await initDB();
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const operatorPassword = await bcrypt.hash('operator123', 10);

  try {
    await User.create({
      username: 'admin',
      password: adminPassword,
      role: 'admin'
    });
    
    await User.create({
      username: 'operator',
      password: operatorPassword,
      role: 'operator'
    });

    console.log('Seed successful: admin/admin123 and operator/operator123 created.');
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('Users already exist, skipping seed.');
    } else {
      console.error('Seed failed:', error);
    }
  }
};

seed();
