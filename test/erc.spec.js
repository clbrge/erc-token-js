import { ethers } from 'ethers'
import { expect } from 'chai'
import * as dotenv from 'dotenv'

import {
  Token,
  TokenAmount,
  TokenAmountSet,
  expandToNDecimals
} from '../src/index.js'

dotenv.config()

let usdc, uni, ethToken

const addresses = {
  USDC: process.env.USDC_ADDRESS,
  DAI: process.env.DAI_ADDRESS,
  UNI: process.env.UNI_ADDRESS
}

const chainId = process.env.CHAIN_ID

const getERC20Contract = (address) => {
  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER)
  const abi = [
    'function name() public view returns (string)',
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ]
  return new ethers.Contract(address, abi, provider)
}

describe('Token', function () {
  it('should throw error on direct constructor call', function () {
    expect(() => new Token({})).to.throw('[Token] no constructor direct call')
  })

  it('fromObject', async function () {
    const usdcToken = Token.from({
      chainId,
      address: addresses.USDC,
      decimals: 6,
      symbol: 'USDC'
    })

    usdc = usdcToken

    expect(usdcToken).to.include({ decimals: 6 })
  })

  xit('fromContract', async function () {
    const USDC = await getERC20Contract(addresses.USDC)

    usdc = await Token.from(USDC)

    expect(usdc).to.include({ decimals: 6 })
  })

  it('Native', async function () {
    const ethToken = await Token.native({
      decimals: 18,
      symbol: 'Ether',
      symbol: 'ETH',
      formatSymbol: ethers.EtherSymbol
    })

    const token = Token.from(ethToken)

    expect(token).to.include({ decimals: 18 })
  })
})

describe('TokenERC20Amount', function () {
  it('should throw error on direct constructor call', function () {
    expect(() => new TokenAmount({})).to.throw(
      '[TokenAmount] no constructor direct call'
    )
  })

  it('format derived from number', async function () {
    const amount = await TokenAmount.from(usdc, 0.99)
    const json = JSON.stringify(amount)
    expect(TokenAmount.from(JSON.parse(json)).toString()).to.equal('USDC 0.99')
  })

  it('toJSON', async function () {
    // change chainId doesn't change format
    const usdcToken = await Token.from(usdc, { chainId: 6 })

    const amount = await TokenAmount.from(usdcToken, 11111)

    expect(amount.toString()).to.equal('USDC 11,111.00')
  })

  it('from Object', async function () {
    const fromObject = {
      token: {
        type: 'ERC20',
        _isToken: true,
        _isNative: false,
        address: '0x3917C8B4358cE1167470CbE286f1c8096dc15d33',
        chainId: 1337,
        name: 'USDC Test',
        symbol: 'USDC',
        decimals: 6
      },
      number: {
        type: 'BigNumber',
        hex: '0x34edce00'
      },
      _isTokenAmount: true
    }

    const amount5 = await TokenAmount.from(fromObject)
  })

  it('format derived from bigint', async function () {
    // change chainId doesn't change format
    const usdcToken = await Token.from(usdc, { chainId: 6 })

    const amount = await TokenAmount.from(usdcToken, 3000000n)

    expect(amount.toString()).to.equal('USDC 3.00')
  })

  it('arithmetic operations with different input types', async function () {
    const amountA = await TokenAmount.from(usdc, 3)
    const amountB = await TokenAmount.from(usdc, 2)

    expect(amountA.add(amountB).toString()).to.equal('USDC 5.00')
    expect(amountA.add(2).toString()).to.equal('USDC 5.00')

    expect(amountA.sub(amountB).toString()).to.equal('USDC 1.00')
    expect(amountA.sub(2).toString()).to.equal('USDC 1.00')

    expect(amountA.mul(amountB).toString()).to.equal('USDC 6,000,000.00')
    expect(amountA.mul(6n).toString()).to.equal('USDC 18.00')

    expect(amountA.div(3n).toString()).to.equal('USDC 1.00')
  })

  it('comparison operations', async function () {
    const amountA = await TokenAmount.from(usdc, 2)
    const amountB = await TokenAmount.from(usdc, 3)

    expect(amountA.eq(amountB)).to.be.false
    expect(amountA.eq(2)).to.be.true

    expect(amountA.gt(amountB)).to.be.false
    expect(amountA.gt(1)).to.be.true

    expect(amountA.gte(amountB)).to.be.false
    expect(amountA.gte(2)).to.be.true
  })
})

// TODO

xdescribe('TokenAmountSet', function () {
  it('xxx', async function () {
    const usdcToken = await Token.from(usdc)
    const uniToken = await Token.from({
      token: {
        type: 'ERC20',
        _isToken: true,
        _isNative: false,
        address: '0x3917C8B4358cE1167470CbE286f1c8096dc15d33',
        chainId: 1337,
        name: 'USDC Test',
        symbol: 'USDC',
        decimals: 6
      },
      number: {
        type: 'BigNumber',
        hex: '0x34edce00'
      },
      _isTokenAmount: true
    })

    const set = await TokenAmountSet.from([])

    set.add(TokenAmount.from(usdcToken, 10))
    set.add(TokenAmount.from(uniToken, 100))

    set.add(TokenAmount.from(usdcToken, 2))
    set.add(TokenAmount.from(uniToken, 45))

    set.add(TokenAmount.from(ethToken, 2))

    set.add(TokenAmount.from(usdcToken, 0.001))
    set.add(TokenAmount.from(uniToken, 0.001))
    set.add(TokenAmount.from(ethToken, 0.001))

    set.add(TokenAmount.from(ethToken, 1))
    set.add(TokenAmount.from(ethToken, BigInt(42)))

    console.log(set)
    // console.log( set+'' )

    // test different chainId => shoudl throw
  })
})
