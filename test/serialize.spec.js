import { ethers } from 'ethers'
import { expect } from 'chai'
import { Token, TokenAmount } from '../src/index.js'

describe('Serialization and Deserialization', function () {
  let usdc

  before(async function () {
    usdc = Token.from({
      chainId: 1,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      symbol: 'USDC'
    })
  })

  it('Token serialization and deserialization', async function () {
    const serializedToken = JSON.stringify(usdc)
    const deserializedToken = Token.from(JSON.parse(serializedToken))

    expect(deserializedToken).to.deep.equal(usdc)
  })

  it('TokenAmount serialization and deserialization', async function () {
    const tokenAmount = await TokenAmount.from(usdc, 42)
    const serializedTokenAmount = JSON.stringify(tokenAmount)
    const deserializedTokenAmount = TokenAmount.from(
      JSON.parse(serializedTokenAmount)
    )

    expect(deserializedTokenAmount).to.deep.equal(tokenAmount)
  })

  it('Serialize and deserialize nested TokenAmount in an object', async function () {
    const tokenAmount = await TokenAmount.from(usdc, 42)
    const complexObject = {
      id: 1,
      name: 'Test Object',
      amount: tokenAmount
    }

    const serializedComplexObject = JSON.stringify(complexObject)
    const deserializedComplexObject = JSON.parse(serializedComplexObject)

    deserializedComplexObject.amount = TokenAmount.from(
      deserializedComplexObject.amount
    )

    expect(deserializedComplexObject).to.deep.equal(complexObject)
  })
})
