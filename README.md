# `erc-token-js`

`erc-token-js` is a versatile JavaScript library tailored for handling Ethereum blockchain ERC20 tokens and native tokens, emphasizing serialization, deserialization, and display capabilities. This library streamlines the process of interacting with tokens by offering a user-friendly interface for creating, formatting, and performing arithmetic operations on token amounts.

**Features:**

- Create `Token` and `TokenAmount` instances from various sources, including objects and ethers.js contracts class
- Effortlessly perform arithmetic operations (addition, subtraction, multiplication, and division) on token amounts
- Intuitive formatting of token amounts for display purposes
- Easily serialize and deserialize Token and TokenAmount classes in JSON format, ideal for storing data in databases or IPFS
- Automatic unserialization when recreating classes from objects
- Support for native tokens (e.g., Ether)
- Seamless integration with and extension of the popular [ethers.js library](https://docs.ethers.io/)

## Installation

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c):
Node 12+ is needed to use it and it must be `import`ed instead of `require`d.

Install the package using npm:

```bash
npm install erc-token-js
```

## Importing the Library

```javascript
import { Token, TokenAmount, expandToNDecimals } from 'erc-token-js'
```

## Creating Tokens

Create a new token from an object:

```javascript
const tknToken = Token.from({
  chainId: 1,
  address: '0x...',
  name: 'Token Name',
  symbol: 'TKN',
  decimals: 18
})
```

When creating a Token instance, you need to provide an object with the following properties:
Mandatory properties

- `chainId`: The chain ID of the Ethereum network the token is on (e.g., 1 for Ethereum Mainnet, 3 for Ropsten, etc.).
- `address`: The contract address of the ERC20 token on the Ethereum blockchain.
- `decimals`: The number of decimal places the token uses (e.g., 18 for most ERC20 tokens).

Optional properties

- `name`: The full name of the token (e.g., "Dai Stablecoin").
- `symbol`: The symbol used to represent the token (e.g., "DAI").
- `formatSymbol`: A custom symbol used for formatting display purposes (e.g., "Ξ" for Ether). If not provided, the library will use the symbol property instead.

Create a new token from an ethers.js contract:

```javascript
const token = await Token.from(contractInstance)
```

Create a native token (e.g., Ether):

```javascript
const nativeToken = Token.native({
  decimals: 18,
  name: 'Ether',
  symbol: 'ETH',
  formatSymbol: 'Ξ'
})
```

## Working with `TokenAmount`

### Create a new token amount

```javascript
const amount = TokenAmount.from(token, 123)
```

In `erc-token-js`, when you create a `TokenAmount` with a decimal number, the library will automatically expand it to its corresponding value with the token's full decimals. For instance, if your token has 18 decimals and you provide 1 as the amount, it will be internally represented as 1 \* 10^18. However, if you prefer to avoid this automatic decimals expansion, you can directly provide a BigInt number as the amount. In this case, the library will use the provided BigInt value without any further modification, allowing for more precise control over the internal representation of token amounts.

```javascript
import { Token, TokenAmount } from 'erc-token-js'

// Assuming you have a token instance, for example, USDC with 6 decimals
const usdc = Token.from({
  chainId: 1,
  address: '0xUSDC_ADDRESS',
  decimals: 6,
  symbol: 'USDC'
})

// Automatic decimals expansion
const amountA = TokenAmount.from(usdc, 1) // 1 USDC will be represented as 1 * 10^6 internally
console.log(amountA.toString()) // "USDC 1.00"

// Using BigInt to avoid decimals expansion
const amountB = TokenAmount.from(usdc, 10000n) // 1 * 10^4 USDC
console.log(amountB.toString()) // "USDC 0.01"
```

### Perform arithmetic operations on token amounts

```javascript
const amountA = TokenAmount.from(tknToken, 3)
const amountB = TokenAmount.from(tknToken, 2)

const sum = amountA.add(amountB) // '5.00 TKN'
const difference = amountA.sub(amountB) // '1.00 TKN'
const product = amountA.mul(amountB) // '6,000,000.00 TKN'
const product = amountA.mul(2n) // '6.00 TKN'
const quotient = amountA.div(3n) // '1.00 TKN'
```

In `erc-token-js`, arithmetic operations work on the full expanded amount. This means that when performing operations like multiplication or division, the internal representation with all decimal places is used. For example, when you multiply a token with 6 decimals by 6, it actually multiplies the internal value by 6,000,000. If you're looking to multiply the token amount by just 6, you should use "6n" or BigInt(6) as the argument. This ensures that the operation is performed with the intended value, avoiding unexpected results due to the internal representation.

```javascript
const amount = TokenAmount.from(usdc, 1) // 1 USDC with 6 decimals

const multipliedBySixMillion = amount.mul(6) // Multiplies by 6,000,000
console.log(multipliedBySixMillion.toString()) // "USDC 6,000,000.00"

const multipliedBySix = amount.mul(6n) // Multiplies by 6
console.log(multipliedBySix.toString()) // "USDC 6.00"

// Alternatively, you can use BigInt(6)
const multipliedBySixAlt = amount.mul(BigInt(6))
console.log(multipliedBySixAlt.toString()) // "USDC 6.00"
```

In the previous example, using 6n or BigInt(6) provides the expected result, while using 6 as the argument would lead to an unintended outcome due to the internal representation of the token amount unless you really want to multiply by six million.

### Format token amounts for display

```javascript
const formattedAmount = amount.toString() // '123.00 USDC'
```

## Serialization and Deserialization

`erc-token-js` is designed with easy serialization and deserialization of `Token` and `TokenAmount` instances in mind, making it perfect for storing and retrieving data from databases or IPFS.

Both `Token` and `TokenAmount` classes can be serialized into JSON and deserialized back into their respective classes effortlessly. This enables you to store token-related data as JSON and recreate the classes with all their functionalities when needed.

Here's an example demonstrating the serialization and deserialization process:

```javascript
import { Token, TokenAmount } from 'erc-token-js'

// Create a Token instance
const usdc = Token.from({
  chainId: 1,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  symbol: 'USDC'
})

// Serialize the Token instance into JSON
const serializedToken = JSON.stringify(usdc)

// Deserialize the JSON back into a Token instance
const deserializedToken = Token.from(JSON.parse(serializedToken))

// Create a TokenAmount instance
const tokenAmount = await TokenAmount.from(usdc, 42)

// Serialize the TokenAmount instance into JSON
const serializedTokenAmount = JSON.stringify(tokenAmount)

// Deserialize the JSON back into a TokenAmount instance
const deserializedTokenAmount = TokenAmount.from(
  JSON.parse(serializedTokenAmount)
)
```

You can also serialize and deserialize objects containing `TokenAmount` instances:

```javascript
// Create an object containing a TokenAmount instance
const complexObject = {
  id: 1,
  name: 'Test Object',
  amount: tokenAmount
}

// Serialize the object into JSON
const serializedComplexObject = JSON.stringify(complexObject)

// Deserialize the JSON back into an object
const deserializedComplexObject = JSON.parse(serializedComplexObject)

// Convert the deserialized amount back into a TokenAmount instance
deserializedComplexObject.amount = TokenAmount.from(
  deserializedComplexObject.amount
)
```

This feature allows you to easily work with token data, no matter how you choose to store or transfer it.

## Utility Functions

Expand a number to N decimals:

```javascript
const expanded = expandToNDecimals(18)(1) // Returns a BigInt with 18 decimals
```
