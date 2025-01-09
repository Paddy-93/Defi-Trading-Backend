import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from './sequelize'; // Import the sequelize instance

class Nonce extends Model {
    public address!: string;
    public nonce!: string;
    public createdAt!: Date;
    public updatedAt!: Date;
}

Nonce.init(
    {
        address: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        nonce: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize, // Bind the sequelize instance to this model
        modelName: 'Nonce',
    },
);

export { Nonce };
