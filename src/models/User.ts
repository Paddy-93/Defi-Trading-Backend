import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from './sequelize'; // Import the sequelize instance

class User extends Model {
    public id!: number;
    public username!: string;
    public walletAddress!: string;
    public privateKey!: string; // Store private key
    public accountAddress!: string; // Store Ethereum account address (address)
    public createdAt!: Date;
    public updatedAt!: Date;
}

User.init(
    {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        walletAddress: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, // Ensure wallet address is unique
        },
        privateKey: {
            type: DataTypes.STRING,
            allowNull: false, // Private key is required
        },
        accountAddress: {
            type: DataTypes.STRING,
            allowNull: false, // Ethereum account address is required
        },
    },
    {
        sequelize,
        modelName: 'User',
    },
);

export { User };
