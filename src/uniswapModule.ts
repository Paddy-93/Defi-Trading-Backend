import { ethers } from 'ethers';
import UniswapRouterData from './data/UniswapV2Router02.json';

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545'); // RPC URL

// Uniswap contract addresses and ABIs
const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // UniswapV2Router02
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH Address
const slippagePercentage = 5; // Slippage protection percentage
const tokenAddress = '0x083B3214c3645bf71Ab2ab0FcF76E0f77De6217C'; // Your token address

const UniswapV2RouterABI = UniswapRouterData.abi;
const ERC20ABI = [
    'function name() external view returns (string)',
    'function symbol() external view returns (string)',
    'function decimals() external view returns (uint8)',
    'function totalSupply() external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)',
    'function transfer(address recipient, uint256 amount) external returns (bool)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// Helper function to get signer from mnemonic
export async function getSignerFromMnemonic(index: number): Promise<string> {
    const seedPhrase = process.env.MNEMONIC; // Store the seed phrase in .env
    if (!seedPhrase) {
        throw new Error('Mnemonic not found in environment variables.');
    }
    const mnemonic = ethers.Mnemonic.fromPhrase(seedPhrase);
    const wallet = ethers.HDNodeWallet.fromMnemonic(
        mnemonic,
        `m/44'/60'/0'/0/${index}`,
    );
    return wallet.privateKey;
}

// Approve token spend for Uniswap
export async function approveToken(
    token: ethers.Contract,
    amount: ethers.BigNumberish,
    signer: ethers.Wallet,
): Promise<void> {
    console.log('Approving token for Uniswap router...');
    const tx = await token.approve(routerAddress, amount);
    await tx.wait();
    console.log('Token approved.');
}

// Add liquidity function with parameters
export async function addLiquidity(
    signer: ethers.Wallet,
    amountTokenDesired: ethers.BigNumberish,
    amountTokenMin: ethers.BigNumberish,
    amountETHMin: ethers.BigNumberish,
    ethAmount: ethers.BigNumberish,
): Promise<void> {
    const router = new ethers.Contract(
        routerAddress,
        UniswapV2RouterABI,
        signer,
    );
    const token = new ethers.Contract(tokenAddress, ERC20ABI, signer);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // Deadline (10 minutes)

    await approveToken(token, amountTokenDesired, signer);

    console.log('Adding liquidity...');
    const tx = await router.addLiquidityETH(
        tokenAddress,
        amountTokenDesired,
        amountTokenMin,
        amountETHMin,
        signer.address,
        deadline,
        { value: ethAmount },
    );
    const receipt = await tx.wait();
    console.log('Liquidity added. Transaction hash:', receipt.transactionHash);
}

// Buy tokens with ETH
export async function buyTokensETH(signer: ethers.Wallet): Promise<void> {
    const router = new ethers.Contract(
        routerAddress,
        UniswapV2RouterABI,
        signer,
    );
    const token = new ethers.Contract(tokenAddress, ERC20ABI, signer);
    const ethAmount = ethers.parseUnits('.018', 18); // Amount of ETH to send (can adjust)

    try {
        const amountsOut = await router.getAmountsOut(ethAmount, [
            WETH_ADDRESS,
            tokenAddress,
        ]);
        console.log('Amounts Out:', amountsOut);

        const amountTokenMin = ethers.toBigInt(amountsOut[1].toString());
        const slippageAdjustedAmount =
            (amountTokenMin * (100n - BigInt(slippagePercentage))) / 100n;

        // Get balance before transaction
        const balanceBefore = await token.balanceOf(signer.address);
        console.log('Balance before:', ethers.formatUnits(balanceBefore, 18));

        const tx = await router.swapExactETHForTokens(
            slippageAdjustedAmount,
            [WETH_ADDRESS, tokenAddress],
            signer.address,
            Math.floor(Date.now() / 1000) + 60 * 10,
            { value: ethAmount },
        );
        const receipt = await tx.wait();
        console.log(
            'Tokens purchased. Transaction hash:',
            receipt.transactionHash,
        );

        // Get balance after transaction
        const balanceAfter = await token.balanceOf(signer.address);
        console.log('Balance after:', ethers.formatUnits(balanceAfter, 18));

        // Output tokens bought
        const tokensBought = ethers.formatUnits(
            balanceAfter - balanceBefore,
            18,
        );
        console.log('Tokens bought:', tokensBought);
    } catch (error) {
        console.error('Error in fetching amountsOut or in transaction:', error);
    }
}

// Sell exact tokens for ETH
export async function sellExactTokens(
    tokenAddress: string,
    amountToSell: number,
    signer: ethers.Wallet,
): Promise<void> {
    const token = new ethers.Contract(tokenAddress, ERC20ABI, signer);
    const formattedAmountToSell = ethers.parseUnits(
        amountToSell.toString(),
        18,
    ); // Use correct decimals

    const router = new ethers.Contract(
        routerAddress,
        UniswapV2RouterABI,
        signer,
    );

    // Approve token spend for Uniswap
    await approveToken(token, formattedAmountToSell, signer);

    // Define the path from Token -> WETH (ETH)
    const path = [tokenAddress, WETH_ADDRESS];
    const amountsOut = await router.getAmountsOut(formattedAmountToSell, path);
    const amountOutMin =
        (ethers.toBigInt(amountsOut[1].toString()) *
            (100n - BigInt(slippagePercentage))) /
        100n;

    // Get balance before transaction
    const balanceBefore = await provider.getBalance(signer.address);
    console.log(
        'Balance before transaction:',
        ethers.formatUnits(balanceBefore, 18),
    );

    try {
        const tx = await router.swapExactTokensForETH(
            formattedAmountToSell,
            amountOutMin,
            path,
            signer.address,
            Math.floor(Date.now() / 1000) + 60 * 10,
        );
        const receipt = await tx.wait();
        console.log('Tokens sold. Transaction hash:', receipt.transactionHash);

        // Get balance after transaction
        const balanceAfter = await provider.getBalance(signer.address);
        console.log('Balance after:', ethers.formatUnits(balanceAfter, 18));

        // Output ETH received
        const ethReceived = ethers.formatUnits(
            balanceAfter - balanceBefore,
            18,
        );
        console.log('ETH received:', ethReceived);
        console.log(
            'Token balance after:',
            await token.balanceOf(signer.address),
        );
    } catch (error) {
        console.error('Error during the swap:', error);
    }
}

// Get the current price of the token in ETH
export async function getPrice(tokenAddress: string): Promise<string | null> {
    const signer = new ethers.Wallet(await getSignerFromMnemonic(2), provider);
    const router = new ethers.Contract(
        routerAddress,
        UniswapV2RouterABI,
        signer,
    );

    try {
        const path = [WETH_ADDRESS, tokenAddress];
        const amountsOut = await router.getAmountsOut(
            ethers.parseUnits('1', 18),
            path,
        ); // Get 1 token's price

        const ethAmountRequired = amountsOut[0];
        const tokenAmountForETH = amountsOut[1];

        console.log(
            `ETH Amount required for 1 token: ${ethers.formatUnits(ethAmountRequired, 18)} ETH`,
        );
        console.log(
            `1 ETH will buy: ${ethers.formatUnits(tokenAmountForETH, 18)} Tokens`,
        );

        return ethers.formatUnits(ethAmountRequired, 18); // Return the price in ETH for 1 token
    } catch (error) {
        console.error('Error in fetching token price:', error);
        return null;
    }
}

export async function buyTokensExactAmount(
    amount: number,
    address: string,
    privateKey: string,
) {
    const signer = new ethers.Wallet(privateKey, provider);

    // Define Uniswap Router Contract
    const router = new ethers.Contract(
        routerAddress, // Uniswap V2 Router address
        UniswapV2RouterABI, // Uniswap V2 Router ABI
        signer,
    );

    // Define the token you want to buy
    const token = new ethers.Contract(
        address, // The token's address
        ERC20ABI, // The ERC20 token ABI
        signer,
    );

    // Define how many tokens you want to buy (1000 tokens with 18 decimals)
    const targetTokenAmount = ethers.parseUnits(amount.toString(), 18); // 1000 tokens with 18 decimals
    console.log(
        'Target token amount (in smallest units):',
        targetTokenAmount.toString(),
    );
    console.log(
        'Target token amount (in tokens):',
        ethers.formatUnits(targetTokenAmount, 18),
    );

    // Define the path from WETH -> Token
    const path = [WETH_ADDRESS, tokenAddress]; // Adjust this path if needed (e.g., USDT -> WETH -> Token)

    // Get the balance of tokens before the transaction
    const balanceBefore = await token.balanceOf(signer.address);
    console.log(
        'Balance before transaction:',
        ethers.formatUnits(balanceBefore, 18),
    );

    // Get the amount of ETH required to buy exactly 1000 tokens
    try {
        const amountsIn = await router.getAmountsIn(targetTokenAmount, path);
        console.log('Amounts In (ETH required for tokens):', amountsIn);

        const ethAmountRequired = amountsIn[0]; // This gives the amount of ETH in wei
        console.log(
            'ETH Amount required (in wei):',
            ethAmountRequired.toString(),
        );

        // Ensure that the ETH amount is valid
        if (ethAmountRequired <= 0) {
            console.error('ETH amount required is zero or invalid.');
            return;
        }

        // Apply slippage protection (e.g., 1%)
        const slippagePercentage = 1; // Adjust slippage as needed
        const slippageAdjustedEthAmount =
            (ethers.toBigInt(ethAmountRequired.toString()) *
                (100n + BigInt(slippagePercentage))) /
            100n;

        console.log(
            'Slippage Adjusted ETH Amount (in wei):',
            slippageAdjustedEthAmount.toString(),
        );

        // Perform the swap
        const tx = await router.swapExactETHForTokens(
            targetTokenAmount, // Exact amount of tokens to buy
            path, // Swap path (ETH -> Token)
            signer.address, // The recipient address (signer's address)
            Math.floor(Date.now() / 1000) + 60 * 10, // Deadline (10 minutes from now)
            { value: slippageAdjustedEthAmount }, // ETH to send (with slippage adjustment)
        );

        const receipt = await tx.wait();
        console.log(
            'Tokens purchased. Transaction hash:',
            receipt.transactionHash,
        );

        // Balance of the user after the transaction
        const balanceAfter = await token.balanceOf(signer.address);
        console.log('Balance after:', ethers.formatUnits(balanceAfter, 18));

        // Output the number of tokens bought
        const tokensBought = ethers.formatUnits(
            balanceAfter.sub(balanceBefore),
            18,
        );
        console.log('Tokens bought:', tokensBought);
    } catch (error) {
        console.error('Error in fetching amountsIn or in transaction:', error);
    }
}
