import { BigNumber } from 'ethers';

export type PoolAssetInfo = {
  poolAmount: BigNumber;
  /// @notice amount of token reserved for paying out when user decrease long position
  reservedAmount: BigNumber;
  /// @notice total borrowed (in USD) to leverage
  guaranteedValue: BigNumber
  /// @notice total size of all short positions
  totalShortSize: BigNumber;
}
export type AssetInfo = {
  averageShortPrice: BigNumber;
  price: BigNumber;
  value: BigNumber;
  effectivePoolAmount: BigNumber; // poolAmount - reservedAmount + guaranteedAmount (guaranteedValue / price) - shortPnlAmount
  name: string;
  assetAddr: string;
} & PoolAssetInfo;

export type TrancheInfo = {
  trancheValue: BigNumber;
  assets: AssetInfo[];
}

export type LevelFee = {
  // /// @notice charge when changing position size
  // uint256 positionFee;
  // /// @notice charge when liquidate position (in dollar)
  // uint256 liquidationFee;
  // /// @notice swap fee used when add/remove liquidity, swap token
  // uint256 baseSwapFee;
  // /// @notice tax used to adjust swapFee due to the effect of the action on token's weight
  // /// It reduce swap fee when user add some amount of a under weight token to the pool
  // uint256 taxBasisPoint;
  // /// @notice swap fee used when add/remove liquidity, swap token
  // uint256 stableCoinBaseSwapFee;
  // /// @notice tax used to adjust swapFee due to the effect of the action on token's weight
  // /// It reduce swap fee when user add some amount of a under weight token to the pool
  // uint256 stableCoinTaxBasisPoint;
  // /// @notice part of fee will be kept for DAO, the rest will be distributed to pool amount, thus
  // /// increase the pool value and the price of LP token
  // uint256 daoFee;
  
  positionFee: BigNumber;
  liquidationFee: BigNumber;
  baseSwapFee: BigNumber;
  taxBasisPoint: BigNumber;
  stableCoinBaseSwapFee: BigNumber;
  stableCoinTaxBasisPoint: BigNumber;
  daoFee: BigNumber;
  
}
export type LLpInfo = {
  totalSupply: BigNumber;
  userAddr: string;
  userBalance: BigNumber;
  userRewardDebt: BigNumber;
}
export type LvMSUserInfo = {
  amount: BigNumber;
  rewardDebt: BigNumber;
}

// struct GetPositionReturnVars {
//   address primaryAccount;
//   uint256 size;
//   uint256 collateral;
//   uint256 averagePrice;
//   uint256 entryBorrowingRate;
//   int256 entryFundingRate;
//   uint256 reserveAmount;
//   uint256 realizedPnl;
//   bool hasProfit;
//   uint256 lastIncreasedTime;
//   int256 fundingFeeDebt;
// }

export type AlperpPosition = {
  primaryAccount: string;
  size: BigNumber;
  collateral: BigNumber;
  averagePrice: BigNumber;
  entryBorrowingRate: BigNumber;
  entryFundingRate: BigNumber;
  reserveAmount: BigNumber;
  realizedPnl: BigNumber;
  hasProfit: boolean;
  lastIncreasedTime: BigNumber;
  fundingFeeDebt: BigNumber;
}
export type AlpPosWrapper = {
  borrowingFee: BigNumber;
  fundingFee: BigNumber;
  pnl: BigNumber;
  netCollateral: BigNumber;
  netPnl: BigNumber;
  netValue: BigNumber;
} & AlperpPosition;
export type AlperpPositionDelta = {
  isProfit: boolean;
  unsignedDelta: BigNumber;
  fundingFee: BigNumber;
}
export type TokenInfo = {
  name: string;
  asset: AssetInfo;
  userEffectivePoolAmount: BigNumber;
  userEffectivePoolValue: BigNumber;
  position: AlpPosWrapper;
  // positionDelta: AlperpPositionDelta;
}

export type HedgeInfo = {
  trancheInfo: TrancheInfo;
  llpInfo: LLpInfo;
  userLpValue: BigNumber;
  totalPositionValue: BigNumber;
  tokenInfos: TokenInfo[];
}