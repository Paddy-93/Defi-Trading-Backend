import hre from 'hardhat';
import { ethers } from 'ethers';
import '@nomiclabs/hardhat-ethers';

describe('Token Contract', () => {
    let token: any; // Declare token at the top
    let accounts: any[];

    beforeAll(async () => {
        accounts = await hre.ethers.getSigners();
        console.log('ACCOUNTS ' + JSON.stringify(accounts));
        const Token = await hre.ethers.getContractFactory('MyToken');
        token = await Token.deploy(
            // Assign to the outer 'token'
            'MyToken',
            'MTK',
            ethers.parseUnits('1000', 18),
        );
        await token.waitForDeployment(); // Ensure the contract is fully deployed

        console.log('Contract deployed at:', await token.getAddress());
    });

    it('should deploy the contract and set the initial supply', async () => {
        const totalSupply = await token.totalSupply();
        expect(totalSupply.toString()).toBe(
            ethers.parseUnits('1000', 18).toString(),
        );
    });

    it('should allow token transfers', async () => {
        const [owner, recipient] = accounts;

        // Transfer 100 tokens
        await token.transfer(recipient.address, ethers.parseUnits('100', 18));

        const ownerBalance = await token.balanceOf(owner.address);
        const recipientBalance = await token.balanceOf(recipient.address);

        expect(ownerBalance.toString()).toBe(
            ethers.parseUnits('200', 18).toString(),
        );
        expect(recipientBalance.toString()).toBe(
            ethers.parseUnits('100', 18).toString(),
        );
    });
});
