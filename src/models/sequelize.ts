import { Sequelize } from 'sequelize';

// Create a new Sequelize instance
const sequelize = new Sequelize(
    'postgres://myuser:mypassword@localhost:5432/mydatabase',
    {
        dialect: 'postgres',
        logging: false, // Disable SQL query logging
    },
);

export { sequelize };
