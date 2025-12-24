# SUPPORTED CHAINS

1 {
name : baseSepolia ,
bridgeCore contract address : 0xDc4d913876c66af5662ac2E8B89315d44028735E
Chain id : 84532
HTTPS_RPC_URL : `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
WS_RPC_URL : `wss://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
}

2 {
name : Arbitrum sepolia ,
bridgeCore contract address : 0xDc4d913876c66af5662ac2E8B89315d44028735E
Chain id : 421614
HTTPS_RPC_URL : `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
WS_RPC_URL : `wss://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
}

3 {
name : polygonAmoy ,
bridgeCore contract address : 0xDc4d913876c66af5662ac2E8B89315d44028735E
Chain id : 80002
HTTPS_RPC_URL : `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
WS_RPC_URL : `wss://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
}

ACHEMY_API_KEY=mHwUamRBnlMWS6A0ViWSQ

---

## SUPPORTED TOKENS ON ALL CHAINS

---

## Base sepolia Canonical

USDC CANONICAL {
address : 0x485734C91949094133080Aa351bC87fb25678830,
name : USDC Coin
symbol : USDC,
decimals : 6
}
ETHt CANONICAL {
address : 0x51dcfF16de245e484acFB6E3Aa6844C22d08737A
name : Ether Test,
symbol : ETHt,
decimals : 18
}

## BASE WRAPPED

1.  {
    "Name": "USD Coin.casper",
    "Symbol": "wUSDC.cspr",
    "address" : "0x39925F7E871c59d01b1C094927D7CeBf5268d291",
    "decimals" : 6
    }

1.  {
    "Name": "Casper",
    "Symbol": "wCSPR",
    "address" : "0xD2EC79Aefa832a944d239b648e9d4B221b919F79",
    decimals : 9
    }

## ARTBITRUM SEPOLIA CANONICAL

USDC CANONICAL {
address : 0x485734C91949094133080Aa351bC87fb25678830,
name : USDC Coin
symbol : USDC,
decimals : 6
}

ETHt CANONICAL {
address : 0x9Fb8A6fA52d130DeF6d5717a470b280E0e836418
name : Ether Test,
symbol : ETHt,
decimals : 18
}

## ARBITRUM WRAPPED

{
"Name": "USD Coin.casper",
"Symbol": "wUSDC.cspr",
"address" : "0x9aD604B60D8b31D994Bb1934bEaDa1770368f005",
"decimals" : 6
}

1.  {
    "Name": "Casper",
    "Symbol": "wCSPR",
    "address" : "0xbCA2CF11A19778B55717d34404D916dEeBe86A65",
    decimals : 9
    }

## AMOY CANONICAL

USDC CANONICAL {
address : 0x485734C91949094133080Aa351bC87fb25678830,
name : USDC Coin
symbol : USDC,
decimals : 6
}

ETHt CANONICAL {
address : 0x9Fb8A6fA52d130DeF6d5717a470b280E0e836418
name : Ether Test,
symbol : ETHt,
decimals : 18
}

## AMOY WRAPPED

{
"Name": "USD Coin.casper",
"Symbol": "wUSDC.cspr",
"address" : "0x9aD604B60D8b31D994Bb1934bEaDa1770368f005",
"decimals" : 6
}

1.  {
    "Name": "Casper",
    "Symbol": "wCSPR",
    "address" : "0x485734C91949094133080Aa351bC87fb25678830",
    decimals : 9
    }

---

## CASPER TOKEN ADDRESSES

---

## CASPER CANONICAL

USD Coin.cspr {
contract package hash : 7b5812d73c9b96ce306507c873d8cb5c422644dbbc7508100af73481894ee769,
contract hash : 9d69442f04906c6190c8259d9e84ff562ce366e03aac85d232ecf177bf7efc58
name : USD Coin.cspr,
symbol : USDC.cspr,
decimals : 6
}

wCSPR.test CANONICAL {
contract package hash : b2a04010466d5dff85802a46f8f24a38507c673598fd8c5279deb0c829c3cbe7,
contract hash : f1ef3c8f60fa956e2bf20528a0983f3bac3ec46264822d4daca0f0a7ce496e0c
name : Casper Test,
symbol : wCSPR.test,
decimals : 9
}

## CASPER WRAPPED TOKENS

{
"sourceChain " : "BaseSepolia"
"Name": "USD Coin.base",
"Symbol": "wUSDC.base",
"contract package hash" : "9716e13aee57220189da15da7e2b4600fc01665112951aa308f6903148f0b09b",
"contract hash : 9baa9fa6639bc4d924e79ef3712ca072db012c55a395d949e706901bb955ca2a,
"decimals" : 6
}

1.  {
    "source chain" "Arbitrum sepolia"
    "Name": "USD Coin.arb",
    "Symbol": "wUSDC.arb",
    "contract package hash" : "335f2733a356ef7eb752c181bebded3a25a85969cbc5bec21e64819470d1a531",
    "contract hash : f8ee53b753730e2e511cb1a3837e74fe9f313449bc0798dc850aadbcb83e753f
    decimals : 6
    }

2.  {
    "source chain" "PlygonAmoy"
    "Name": "USD Coin.polygon",
    "Symbol": "wUSDC.poly",
    "contract package hash" : "d8c7d79bd05996c35aacf9a96eecd19f1b7df6a741baf712d8a6501dcd948350",
    "contract hash " : 0f132a7179155462878cdfa8851fccc8f511f2ddcbea7f5842a3ed9ea84c8899
    decimals : 6
    }
3.  {
    "source chain" "baseSepolia"
    "Name": "Ether.base",
    "Symbol": "wETH.base",
    "contract package hash" : "e6ba8453d61436d7240a8e24a3d53b23c0a86bfd4a212b43392a72159c07aa65",
    contract hash : d8e6605c40b8e82a3443a3726a9085bf94c99f760ca798c55d1e6521e00c7c1f
    decimals : 18
    }

4.  {
    "source chain" "Arbitrum sepolia"
    "Name": "Ether.arb",
    "Symbol": "wETH.arb",
    "contract package hash" : "ac9099b042d007fa84649b03711d977ce388fec3474eb0c0bf2f9bff2c7fd328",
    contract hash : 2b5c8a826d76bcc9d2b96113435d2bff86a31bafeeec9a672abf01d6939b1ed3
    decimals : 18
    }

---

# CURRENTLY WHITELISTED TOKENS

---

## Casper

1. wCSPR.test CANONICAL {
   contract package hash : b2a04010466d5dff85802a46f8f24a38507c673598fd8c5279deb0c829c3cbe7,
   contract hash : f1ef3c8f60fa956e2bf20528a0983f3bac3ec46264822d4daca0f0a7ce496e0c
   name : Casper Test,
   symbol : wCSPR.test,
   decimals : 9
   }

2. {
   "sourceChain " : "BaseSepolia"
   "Name": "USD Coin.base",
   "Symbol": "wUSDC.base",
   "contract package hash" : "9716e13aee57220189da15da7e2b4600fc01665112951aa308f6903148f0b09b",
   "contract hash : 9baa9fa6639bc4d924e79ef3712ca072db012c55a395d949e706901bb955ca2a,
   "decimals" : 6
   }

## Base

USDC CANONICAL {
address : 0x485734C91949094133080Aa351bC87fb25678830,
name : USDC Coin
symbol : USDC,
decimals : 6
}

{
"Name": "Casper",
"Symbol": "wCSPR",
"address" : "0xD2EC79Aefa832a944d239b648e9d4B221b919F79",
decimals : 9
}
