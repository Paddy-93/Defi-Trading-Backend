import hre from 'hardhat';
import { ethers } from 'ethers';
import '@nomiclabs/hardhat-ethers';

describe('Test Uniswap Functions', () => {
    let tokenA: any; // The new ERC-20 token
    let accounts: any[];
    let router: any;

    beforeAll(async () => {
        accounts = await hre.ethers.getSigners();

        // Deploy TokenA
        const TokenA = await hre.ethers.getContractFactory('MyToken');
        tokenA = await TokenA.deploy(
            'TokenB',
            'TKB',
            18,
            ethers.parseUnits('1000000', 0),
        );
        await tokenA.waitForDeployment();

        console.log('TokenA deployed at:', await tokenA.getAddress());
    });

    it('should transfer tokens successfully', async () => {
        const [owner, recipient] = accounts;
        console.log('OWNER IS ' + owner.address);
        // Initial balances
        const ownerBalanceBefore = await tokenA.balanceOf(owner.address);
        const recipientBalanceBefore = await tokenA.balanceOf(
            recipient.address,
        );

        console.log(
            'Owner balance before transfer:',
            ethers.formatUnits(ownerBalanceBefore, 18),
        );
        console.log(
            'Recipient balance before transfer:',
            ethers.formatUnits(recipientBalanceBefore, 18),
        );

        // Transfer 100 tokens
        const transferAmount = ethers.parseUnits('100', 18);
        const transferTx = await tokenA.transfer(
            recipient.address,
            transferAmount,
        );
        await transferTx.wait();

        // Balances after transfer
        const ownerBalanceAfter = await tokenA.balanceOf(owner.address);
        const recipientBalanceAfter = await tokenA.balanceOf(recipient.address);

        console.log(
            'Owner balance after transfer:',
            ethers.formatUnits(ownerBalanceAfter, 18),
        );
        console.log(
            'Recipient balance after transfer:',
            ethers.formatUnits(recipientBalanceAfter, 18),
        );

        // Assertions
        expect(ownerBalanceAfter.toString()).toBe(
            (ownerBalanceBefore - transferAmount).toString(),
        );
        expect(recipientBalanceAfter.toString()).toBe(
            (recipientBalanceBefore + transferAmount).toString(),
        );
    });
});
