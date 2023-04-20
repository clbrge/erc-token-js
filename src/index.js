// SPDX-License-Identifier: MIT

import { ethers, Contract } from 'ethers'

const guard = Symbol()

// work even with space
export const expandToNDecimals = (n) => (s) =>
  ethers.parseUnits((s + '').replace(/\s+/g, ''), n)

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export class Token {
  #iformat

  constructor(
    {
      type = 'ERC20',
      chainId,
      address,
      name,
      symbol,
      decimals,
      formatSymbol,
      formatOptions
    },
    g,
    _isNative
  ) {
    if (g !== guard) throw new Error('[Token] no constructor direct call')

    // type Native / ERC20 / ERC721
    this.type = type
    this._isToken = true

    if (type === 'Native' || _isNative) {
      if (address) throw new Error('Native token have no address')
      this._isNative = true
    } else {
      this._isNative = false
      this.address = address
    }

    this.#iformat = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'ETH',
      currencyDisplay: 'code'
    })
    // check non optional properties
    this.chainId = chainId
    this.name = name
    this.symbol = symbol
    this.decimals = decimals
    this.formatSymbol = formatSymbol
    this.formatOptions = formatOptions
  }

  // return string
  format(number, decimals = this.decimals) {
    return this.#iformat
      .format(ethers.formatUnits(number, decimals))
      .replace('ETH', this.formatSymbol || this.symbol || this.name || '?')
  }

  // return BigInt
  expand(number, decimals = this.decimals) {
    return expandToNDecimals(decimals)(number)
  }

  toJSON() {
    return {
      ...this,
      chainId:
        typeof this.chainId === 'bigint'
          ? this.chainId.toString()
          : this.chainId
    }
  }

  // if number is decimals
  newAmount(number, decimals) {
    if (number instanceof TokenAmount) {
      return new TokenAmount({ token: this, number: number.number }, guard)
    }

    if (typeof number === 'number') {
      return new TokenAmount(
        { token: this, number: this.expand(number) },
        guard
      )
    }

    return new TokenAmount({ token: this, number: BigInt(number) }, guard)
  }

  static native({ decimals = 18, ...defaults }) {
    return new Token({ decimals, ...defaults, type: 'Native' }, guard, true)
  }

  static from(value, defaults = {}) {
    if (value instanceof Token) {
      return value
    }
    if (value instanceof Contract) {
      return new Promise(function (resolve, reject) {
        Promise.all([value.name(), value.decimals(), value.symbol()]).then(
          async ([name, decimals, symbol]) => {
            resolve(
              new Token(
                {
                  ...defaults,
                  name,
                  decimals: Number(decimals),
                  symbol,
                  address: await value.getAddress
                },
                guard
              )
            )
          }
        )
      })
    }

    return new Token({ ...defaults, ...value }, guard)
  }
}

const toTokenAmount = (any, token) => {
  if (any instanceof TokenAmount) return any
  return token.newAmount(any)
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export class TokenAmount {
  constructor({ token, number, tags = [] }, g) {
    if (g !== guard) throw new Error('[TokenAmount] no constructor direct call')

    if (!(token instanceof Token)) {
      throw new Error('[TokenAmount] Invalid token provided')
    }

    if (typeof number !== 'bigint') {
      throw new Error('[TokenAmount] Number must be a BigInt')
    }

    if (!Array.isArray(tags)) {
      throw new Error('[TokenAmount] Tags must be an array')
    }

    this.token = token
    this.number = number
    this.tags = tags
    this._isTokenAmount = true
  }

  clone() {
    return new TokenAmount(
      { token: this.token, number: this.number, tags: [...this.tags] },
      guard
    )
  }

  // TODO use set for tags
  addTag(tag) {
    this.tags = [...this.tags, tag]
  }

  toFormat() {
    return this.token.format(this.number)
  }

  toString() {
    return this.toFormat()
  }

  valueOf() {
    return this.number
  }

  toJSON() {
    return {
      ...this,
      number: {
        type: 'BigNumber',
        hex: '0x' + this.number.toString(16)
      }
    }
  }

  add(any) {
    return toTokenAmount(
      this.number + toTokenAmount(any, this.token).number,
      this.token
    )
  }

  sub(any) {
    return toTokenAmount(
      this.number - toTokenAmount(any, this.token).number,
      this.token
    )
  }

  mul(any) {
    return toTokenAmount(
      this.number * toTokenAmount(any, this.token).number,
      this.token
    )
  }

  div(any) {
    return toTokenAmount(
      this.number / toTokenAmount(any, this.token).number,
      this.token
    )
  }

  lt(any) {
    return this.number < toTokenAmount(any, this.token).number
  }
  lte(any) {
    return this.number <= toTokenAmount(any, this.token).number
  }
  eq(any) {
    return this.number === toTokenAmount(any, this.token).number
  }
  gt(any) {
    return this.number > toTokenAmount(any, this.token).number
  }
  gte(any) {
    return this.number >= toTokenAmount(any, this.token).number
  }

  static from(any, number) {
    if (any instanceof TokenAmount)
      return any.token.newAmount(number || any.number)

    if (any instanceof Contract) throw new Error('not yet supported')

    // convert back from JSON
    if (typeof any === 'object' && any._isTokenAmount) {
      return new TokenAmount(
        {
          token: Token.from(any.token),
          number: BigInt(number || any.number.hex)
        },
        guard
      )
    }

    return Token.from(any).newAmount(number)
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export class TokenAmountSet {
  constructor(map, g) {
    if (g !== guard)
      throw new Error('[TokenAmountSet] no constructor direct call')

    this.map = map
    this._isTokenAmountSet = true
  }

  values() {
    return Array.from(this.map.values())
  }

  toString(separator = ', ') {
    return this.values().join(separator)
  }

  add(amount) {
    if (!(amount instanceof TokenAmount))
      throw new Error('can only add token amount in set')

    if (this.map.has(amount.token.address)) {
      this.map.set(
        amount.token.address,
        this.map.get(amount.token.address).add(amount.number)
      )
    } else {
      this.map.set(amount.token.address, amount.token.newAmount(amount.number))
    }
  }

  static from(amountlist) {
    const set = new TokenAmountSet(new Map(), guard)

    amountlist.forEach((a) => {
      set.add(a)
    })

    return set
  }
}
