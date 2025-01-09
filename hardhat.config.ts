import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-ethers';
import 'solidity-coverage';

const config: HardhatUserConfig = {
    defaultNetwork: 'localhost',
    paths: {
        sources: './contracts', // Path to contracts
        tests: './test', // Path to tests
        cache: './cache', // Path to cache
        artifacts: './artifacts', // Path to artifacts
    },
    solidity: {
        version: '0.8.20', // Update to the correct version
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        localhost: {
            url: 'http://127.0.0.1:8545', // Change as needed
            chainId: 1337,
            accounts: {
                mnemonic: '',
                path: "m/44'/60'/0'/0",
                initialIndex: 0,
                count: 20,
                passphrase: '',
            },
        },
    },
};

export default config;
