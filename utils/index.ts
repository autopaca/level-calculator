import { BigNumber, ethers } from 'ethers';
import LvlPoolAbi from '@/abi/pool.json';
import LvlOracleAbi from '@/abi/oracle.json';
import LLPAbi from '@/abi/LLP.json';
import LvlMSV2Abi from '@/abi/LevelMasterV2.json';
import GetterFacetAbi from '@/abi/GetterFacet.json';
import AlperpPoolOracleAbi from '@/abi/AlperpPoolOracle.json';
import {
  AlperpPosition, AlperpPositionDelta, AlpPosWrapper,
  AssetInfo,
  HedgeInfo,
  LLpInfo,
  LvMSUserInfo,
  PoolAssetInfo,
  TokenInfo,
  TrancheInfo
} from '@/typings/Pool';
import { useEffect, useState } from 'react';
import { parseEther } from 'ethers/lib/utils';

const bscJsonRpc = 'https://bsc-dataseed.binance.org';
// const bscJsonRpc = 'https://bsc.publicnode.com';
export const bscProvider = new ethers.providers.StaticJsonRpcProvider(bscJsonRpc);

export const SeniorLLp = '0xB5C42F84Ab3f786bCA9761240546AA9cEC1f8821'
export const MezzanineLLp = '0x4265af66537F7BE1Ca60Ca6070D97531EC571BDd'
export const JuniorLLp = '0xcC5368f152453D497061CB1fB578D2d3C54bD0A0'

export const USDT = '0x55d398326f99059fF775485246999027B3197955'
export const BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
export const BTC = '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c'
export const ETH = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8'
export const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
export const CAKE = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82'
export const allAssets: Record<string, string> = {
  USDT,
  // BUSD,
  BTC,
  ETH,
  WBNB,
  CAKE,
}
export const trancheAssets = [USDT, BTC, ETH, WBNB, CAKE]
const TOKENS = [BTC, ETH, WBNB];
export const isStableCoin = (assetAddr: string) => {
  return assetAddr === USDT || assetAddr === BUSD;
}
export const LvlPoolAddr = '0xA5aBFB56a78D2BD4689b25B8A77fd49Bb0675874';
export const LvlOracleAddr = '0x04db83667f5d59ff61fa6bbbd894824b233b3693';
export const LvlMSV2Addr = '0x5ae081b6647aef897dec738642089d4bda93c0e7';
export const AlperpPool = '0x18A15bF2Aa1E514dc660Cc4B08d05f9f6f0FdC4e'
export const AlperpPoolOracle = '';
export const lvlPool = new ethers.Contract(LvlPoolAddr, LvlPoolAbi, bscProvider);
export const lvlOracle = new ethers.Contract(LvlOracleAddr, LvlOracleAbi, bscProvider);
export const lvlMSV2 = new ethers.Contract(LvlMSV2Addr, LvlMSV2Abi, bscProvider);
export const alperpGetter = new ethers.Contract(AlperpPool, GetterFacetAbi, bscProvider);
export const llpToken = (tokenAddr: string) => new ethers.Contract(tokenAddr, LLPAbi, bscProvider);
export const formatPositionDelta = (pDelta: AlperpPositionDelta): string => {
  const {isProfit, unsignedDelta, fundingFee} = pDelta;
  return `${isProfit ? '+' : '-'}${commifyUnits(unsignedDelta)} (funding fee: ${commifyUnits(fundingFee)})`;
}
export const commifyUnits = (value: BigNumber, decimals: number = 18) => {
  return ethers.utils.commify(Number(ethers.utils.formatUnits(value, decimals)).toFixed(4))
}
export const commifyValue = (value: BigNumber) => '$' + commifyUnits(value, 30);
export const commifyPrice = (value: BigNumber) => '$' + commifyUnits(value, 12);

export const calcPnl = (side: 'LONG' | 'SHORT', positionSize: BigNumber, entryPrice: BigNumber, indexPrice: BigNumber) => {
  if (positionSize.isZero() || entryPrice.isZero()) {
    return BigNumber.from(0);
  }
  if (side === 'LONG') {
    return indexPrice.sub(entryPrice).mul(positionSize).div(entryPrice);
  } else {
    return entryPrice.sub(indexPrice).mul(positionSize).div(entryPrice);
  }
}
export const useJuniorTrancheInfo = (): [TrancheInfo | undefined, boolean] => {
  const [trancheInfo, setTrancheInfo] = useState<TrancheInfo | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const tv = await lvlPool.getTrancheValue(JuniorLLp, true);
      const ps = await lvlOracle.getMultiplePrices(Object.values(allAssets), true);
      const assets: AssetInfo[] = [];
      const assetNames = Object.keys(allAssets);
      for (let i = 0; i < assetNames.length; i++) {
        const aName = assetNames[i];
        const assetAddr = allAssets[aName];
        try {
          const price = ps[i]
          const asset = await lvlPool.trancheAssets(JuniorLLp, assetAddr) as PoolAssetInfo;
          let value = BigNumber.from(0);
          let averageShortPrice = BigNumber.from(0);
          let effectivePoolAmount = BigNumber.from(0);
          if (isStableCoin(assetAddr)) {
            value = asset.poolAmount.mul(price);
            effectivePoolAmount = asset.poolAmount;
          } else {
            averageShortPrice = await lvlPool.averageShortPrices(JuniorLLp, assetAddr);
            const shortPnl = calcPnl('SHORT', asset.totalShortSize, averageShortPrice, price);
            value = asset.poolAmount.sub(asset.reservedAmount).mul(price).add(asset.guaranteedValue).sub(shortPnl);
            // effectivePoolAmount = asset.poolAmount.sub(asset.reservedAmount).add(asset.guaranteedValue.div(price)).sub(shortPnl.div(price))
            effectivePoolAmount = value.div(price);
          }
          assets.push({...asset, price, averageShortPrice, value, name: aName, effectivePoolAmount, assetAddr})
        } catch (e) {
          console.log(`index ${i} not good`);
        }
      }
      setTrancheInfo({trancheValue: tv, assets})
      setIsLoading(false);
    })()
  }, [])

  return [trancheInfo, isLoading];
}
// export const useLevelFee = (): [LevelFee | undefined, boolean] => {
//   const [fee, setFee] = useState<LevelFee | undefined>();
//   const [isLoading, setIsLoading] = useState(false);
//   useEffect(() => {
//     setIsLoading(true);
//     lvlPool.fee().then((f: LevelFee) => {
//       setFee(f);
//     }).catch((e: unknown) => {
//       console.error(e);
//     }).finally(() => {setIsLoading(false)})
//   }, []);
//   return [fee, isLoading];
// }

export const useLLPInfo = (llpHolder: string, llpTokenAddr: string = JuniorLLp): [LLpInfo | undefined, boolean] => {
  const [llpInfo, setLlpInfo] = useState<LLpInfo | undefined>();
  const token = llpToken(llpTokenAddr);
  let pid = 0;
  if (llpTokenAddr === MezzanineLLp) {
    pid = 1;
  } else if (llpTokenAddr === JuniorLLp) {
    pid = 2;
  }
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    (async () => {
      const totalSupply = await token.totalSupply() as BigNumber;
      const {amount, rewardDebt} = await lvlMSV2.userInfo(pid, llpHolder) as LvMSUserInfo;
      setLlpInfo({totalSupply, userAddr: llpHolder, userBalance: amount, userRewardDebt: rewardDebt});
      setIsLoading(false);
    })()
  }, []);
  return [llpInfo, isLoading];
}
const getLLPInfo = async (userAddr: string, llpTokenAddr: string): Promise<LLpInfo> => {
  const token = llpToken(llpTokenAddr);
  let pid = 0;
  if (llpTokenAddr === MezzanineLLp) {
    pid = 1;
  } else if (llpTokenAddr === JuniorLLp) {
    pid = 2;
  }
  const totalSupply = await token.totalSupply() as BigNumber;
  const {amount, rewardDebt} = await lvlMSV2.userInfo(pid, userAddr) as LvMSUserInfo;
  return {totalSupply, userAddr: userAddr, userBalance: amount, userRewardDebt: rewardDebt};
}
export const useAlperpPositions = (userAddr: string): [AlperpPosition[], boolean] => {
  const [positions, setPositions] = useState<AlperpPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    (async () => {
      const collateral = USDT;
      const indexTokens = [BTC, ETH, WBNB];
      const poss = [];
      for (const indexToken of indexTokens) {
        // params: address account, address collateralToken, address indexToken, bool isLong
        const pos = await alperpGetter.getPosition(userAddr, collateral, indexToken, false) as AlperpPosition;
        poss.push(pos);
      }
      setPositions(poss);
      setIsLoading(false);
    })();
  })
  return [positions, isLoading];
}
const getTrancheInfo = async (llpTokenAddr: string): Promise<TrancheInfo> => {
  const tv = await lvlPool.getTrancheValue(llpTokenAddr, true);
  const ps = await lvlOracle.getMultiplePrices(Object.values(allAssets), true);
  const assets: AssetInfo[] = [];
  const assetNames = Object.keys(allAssets);
  for (let i = 0; i < assetNames.length; i++) {
    const aName = assetNames[i];
    const assetAddr = allAssets[aName];
    try {
      const price = ps[i]
      const asset = await lvlPool.trancheAssets(llpTokenAddr, assetAddr) as PoolAssetInfo;
      let value = BigNumber.from(0);
      let averageShortPrice = BigNumber.from(0);
      let effectivePoolAmount = BigNumber.from(0);
      if (isStableCoin(assetAddr)) {
        value = asset.poolAmount.mul(price);
        effectivePoolAmount = asset.poolAmount;
      } else {
        averageShortPrice = await lvlPool.averageShortPrices(llpTokenAddr, assetAddr);
        const shortPnl = calcPnl('SHORT', asset.totalShortSize, averageShortPrice, price);
        value = asset.poolAmount.sub(asset.reservedAmount).mul(price).add(asset.guaranteedValue).sub(shortPnl);
        // effectivePoolAmount = asset.poolAmount.sub(asset.reservedAmount).add(asset.guaranteedValue.div(price)).sub(shortPnl.div(price))
        effectivePoolAmount = value.div(price);
      }
      assets.push({...asset, price, averageShortPrice, value, name: aName, effectivePoolAmount, assetAddr})
    } catch (e) {
      console.log(`index ${i} not good`);
    }
  }
  return {trancheValue: tv, assets};
}

export const getAlperpPositions = async (userAddr: string): Promise<AlperpPosition[]> => {
  const collateral = USDT;
  const poss = [];
  const deltas = [];
  for (const indexToken of TOKENS) {
    // params: address account, address collateralToken, address indexToken, bool isLong
    const pos = await alperpGetter.getPosition(userAddr, collateral, indexToken, false) as AlperpPosition;
    // const oracleAddr = await alperpGetter.oracle();
    // const alperpPoolOracle = new ethers.Contract(oracleAddr, AlperpPoolOracleAbi, bscProvider);
    // const priceFeeInfo = await alperpPoolOracle.priceFeedInfo(indexToken);
    // const maxPrice = await alperpPoolOracle.getMaxPrice(indexToken, {gasLimit: 100000000});
    // const minPrice = await alperpPoolOracle.getMinPrice(indexToken);
    // console.log({maxPrice})
    // const delta = await alperpGetter.getPositionDelta(userAddr, 0, collateral, indexToken, 0, {gasLimit: 10000000}) as AlperpPositionDelta;
    poss.push(pos);
    // console.log({delta});
    // deltas.push(delta);
  }
  // console.log({deltas})
  return poss;
}
export const getAlperpPositionDeltas = async (positions: AlperpPosition[]): Promise<AlperpPositionDelta[]> => {
  const deltas: AlperpPositionDelta[] = [];
  for (let i = 0; i < TOKENS.length; i++) {
    const indexToken = TOKENS[i];
    const {size, averagePrice, lastIncreasedTime, entryFundingRate, fundingFeeDebt} = positions[i];
    console.log({size, averagePrice, lastIncreasedTime, entryFundingRate, fundingFeeDebt});
    // const delta = await alperpGetter.getDelta(indexToken, size, averagePrice, false, lastIncreasedTime, entryFundingRate, fundingFeeDebt);
    const br = await alperpGetter.getEntryBorrowingRate(USDT, indexToken, false);
    console.log({br})
    const delta = await alperpGetter.getDeltaWithoutFundingFee(indexToken, size, averagePrice, false, lastIncreasedTime);
    console.log({delta});
    deltas.push(delta);
  }
  return deltas;
}
export const useHedgeInfo = (userAddr: string, llpTokenAddr: string = JuniorLLp): [HedgeInfo | undefined, boolean] => {
  const [hedgeInfo, setHedgeInfo] = useState<HedgeInfo | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(true);
    (async () => {
      const trancheInfo = await getTrancheInfo(llpTokenAddr);
      const llpInfo = await getLLPInfo(userAddr, llpTokenAddr);
      const userEffectiveValue = (v: BigNumber) => v.mul(llpInfo.userBalance).div(llpInfo.totalSupply);
      const positions = await getAlperpPositions(userAddr);
      const btcAsset = trancheInfo.assets[1];
      const ethAsset = trancheInfo.assets[2];
      const wbnbAsset = trancheInfo.assets[3];
      const cakeAsset = trancheInfo.assets[4];
      const assets = [btcAsset, ethAsset, wbnbAsset];
      const poss: AlpPosWrapper[] = [];
      for (let i = 0; i < assets.length; i++) {
        const p = positions[i];
        const a = assets[i];
        const indexToken = a.assetAddr;
        const priceDelta = p.averagePrice.sub(a.price.mul(parseEther('1')));
        const pnl = p.size.mul(priceDelta).div(p.averagePrice);
        let fundingFee = await alperpGetter.getFundingFee(indexToken, false, p.size, p.entryFundingRate) as BigNumber;
        fundingFee = fundingFee.add(p.fundingFeeDebt).mul(-1);
        // console.log({pnl: pnl.toString(), p: pnl, priceDetal: priceDelta.toString()})
        //    address, /* account */ address collateralToken, address, /* indexToken */ bool, /* isLong */ uint256 size, uint256 entryBorrowingRate
        let borrowingFee = await alperpGetter.getBorrowingFee(userAddr, USDT, indexToken, false, p.size, p.entryBorrowingRate) as BigNumber;
        borrowingFee = borrowingFee.mul(-1);
        const netCollateral = p.collateral.add(borrowingFee);
        const netPnl = pnl.add(fundingFee);
        const netValue = netCollateral.add(netPnl);
        poss.push({...p, borrowingFee, pnl, fundingFee, netCollateral, netPnl, netValue});
      }
      // const positionDeltas = await getAlperpPositionDeltas(positions);
      const btcToken: TokenInfo = {
        name: "BTC",
        asset: btcAsset,
        userEffectivePoolAmount: userEffectiveValue(btcAsset.effectivePoolAmount),
        userEffectivePoolValue: userEffectiveValue(btcAsset.effectivePoolAmount.mul(btcAsset.price)),
        position: poss[0],
        // positionDelta: positionDeltas[0],
      }
      const ethToken: TokenInfo = {
        name: "ETH",
        asset: ethAsset,
        userEffectivePoolAmount: userEffectiveValue(ethAsset.effectivePoolAmount),
        userEffectivePoolValue: userEffectiveValue(ethAsset.effectivePoolAmount.mul(ethAsset.price)),
        position: poss[1],
        // positionDelta: positionDeltas[1],
      };
      const combinedValue = wbnbAsset.effectivePoolAmount.mul(wbnbAsset.price).add((cakeAsset.effectivePoolAmount).mul(cakeAsset.price));
      const wbnbToken: TokenInfo = {
        name: "WBNB",
        asset: wbnbAsset,
        userEffectivePoolAmount: userEffectiveValue(combinedValue.div(wbnbAsset.price)),
        userEffectivePoolValue: userEffectiveValue(combinedValue),
        position: poss[2],
        // positionDelta: positionDeltas[2],
      }
      const userLpValue = trancheInfo.assets
          .reduce((prev, cur) => cur.effectivePoolAmount.mul(cur.price).add(prev), BigNumber.from(0))
          .mul(llpInfo.userBalance)
          .div(llpInfo.totalSupply)
      const tokenInfos = [btcToken, ethToken, wbnbToken];
      const totalPositionValue = tokenInfos.reduce((prev, {position}) => position.netValue.add(prev), BigNumber.from(0));
      console.log({totalPositionValue})
      setHedgeInfo({trancheInfo, llpInfo, userLpValue, tokenInfos, totalPositionValue});
      setIsLoading(false);
    })();
  }, []);
  return [hedgeInfo, isLoading];
}
