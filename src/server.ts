import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { ethers } from 'ethers';
import { sequelize } from './models/sequelize';
import { Nonce } from './models/Nonce';
import crypto from 'crypto';
import exp from 'constants';
import { User } from './models/User';
import { buyTokensExactAmount } from './uniswapModule';

const app = express();
const port = 5001;

sequelize
    .sync({ alter: true })
    .then(() => console.log('Database synced!'))
    .catch((err) => console.error('Error syncing database:', err));

// Middleware to enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Session middleware to store the user's wallet address
app.use(
    session({
        secret: 'your-secret-key', // Make sure to use a strong secret key
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // In production, set secure to true when using HTTPS
    }),
);

// Function to generate a new Ethereum private key and account address
const generatePrivateKeyAndAccountAddress = () => {
    const wallet = ethers.Wallet.createRandom(); // Create a random wallet
    const privateKey = wallet.privateKey; // Get private key
    const accountAddress = wallet.address; // Get Ethereum address (account address)

    return { privateKey, accountAddress };
};

// A simple route to check if the server is running
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Endpoint to generate and store a unique nonce for the user
app.get('/getNonce/:address', async (req: any, res: any) => {
    const { address } = req.params;

    // Generate a unique nonce
    const nonce = crypto.randomBytes(16).toString('hex'); // 32-character nonce

    try {
        console.log('NONCE IS ' + nonce);
        // Store nonce in the database for the user's wallet address
        await Nonce.upsert({
            address,
            nonce,
        });

        res.status(200).send({ nonce });
    } catch (error) {
        console.error('Error generating nonce:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint to authenticate existing users and create new
app.post('/authenticate', async (req: any, res: any) => {
    const { address, message, signature } = req.body;

    if (!address || !message || !signature) {
        return res
            .status(400)
            .send('Address, message, and signature are required');
    }

    try {
        // Fetch the nonce from the database for the given address
        const userNonce = await Nonce.findOne({ where: { address } });

        if (!userNonce) {
            return res.status(401).send('Nonce not found');
        }

        const expectedMessage = `Please sign this message to authenticate your wallet. Nonce: ${userNonce.nonce}`;

        // Verify that the message matches the expected message
        if (message !== expectedMessage) {
            return res.status(400).send('Invalid message');
        }

        // Recover the address from the signed message
        const recoveredAddress = ethers.verifyMessage(message, signature);

        // Verify that the recovered address matches the provided address
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res.status(401).send('Invalid signature');
        }

        // Signature is valid, proceed with user creation
        let user = await User.findOne({ where: { walletAddress: address } });

        if (!user) {
            // If the user doesn't exist, generate a new private key and account address
            const { privateKey, accountAddress } =
                generatePrivateKeyAndAccountAddress(); // Generate keys

            // Create a new user with private key and account address
            user = await User.create({
                username: `user-${address.substring(0, 6)}`, // Generate a simple username (e.g., 'user-0x1234')
                walletAddress: address,
                privateKey, // Store the generated private key
                accountAddress, // Store the generated Ethereum account address
            });

            console.log('New user created:', user.username);
        } else {
            // await buyTokensExactAmount(
            //     1000,
            //     '0x083B3214c3645bf71Ab2ab0FcF76E0f77De6217C',
            //     user.privateKey,
            // );
        }

        // Clear the nonce after successful authentication
        await Nonce.destroy({ where: { address } });

        res.status(200).send({ message: 'Authenticated', user });
    } catch (error) {
        console.error('Error in authentication:', error);
        res.status(500).send('Internal server error');
    }
});
// Endpoint to check the session and get the authenticated account
app.get('/session', (req: any, res: any) => {
    if (req.session.account) {
        return res.status(200).send({ account: req.session.account });
    } else {
        return res.status(401).send('No session found');
    }
});

// Start the server
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
