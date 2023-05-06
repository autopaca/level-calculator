import { Inter } from 'next/font/google'
import { commifyPrice, commifyUnits, commifyValue, formatPositionDelta, useHedgeInfo } from '@/utils';
import { Card } from 'antd';

const inter = Inter({subsets: ['latin']})

export default function Home() {
  const user = '0xeb5E97Ff959b6a686EfBae32140bab1892B9DF46';
  const [hedgeInfo, hedgeInfoLoading] = useHedgeInfo(user);
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <div style={{width: '100%', margin: 'auto'}}>
        {hedgeInfoLoading && <p>Loading...</p>}
        {hedgeInfo && <div>
          {/*<p>llp total supply: {commifyUnits(hedgeInfo.llpInfo.totalSupply)}</p>*/}
          {/*<p>llp holder balance: {commifyUnits(hedgeInfo.llpInfo.userBalance)}</p>*/}
          {/*<p>llp holder reward debt: {commifyUnits(hedgeInfo.llpInfo.userRewardDebt)}</p>*/}
          <p>user lp value: {commifyValue(hedgeInfo.userLpValue)}</p>
          {/*<p>position value: {commifyValue(hedgeInfo.)}</p>*/}
          <p>total position value: {commifyValue(hedgeInfo.totalPositionValue)}</p>
          <p>lp + position value: {commifyValue(hedgeInfo.userLpValue.add(hedgeInfo.totalPositionValue))}</p>
          {hedgeInfo.tokenInfos.map((tokenInfo, i) => (
            <Card title={tokenInfo.name} bordered={true} style={{width: 1000, background: 'gray'}} key={tokenInfo.name}>
              <p> price: {commifyPrice(tokenInfo.asset.price)} </p>
              <p> pool amount {commifyUnits(tokenInfo.asset.effectivePoolAmount)} </p>
              <p> user pool effective amount {commifyUnits(tokenInfo.userEffectivePoolAmount)} </p>
              <p> user pool effective value {commifyValue(tokenInfo.userEffectivePoolValue)}</p>
              <p> hedge position size: {commifyValue(tokenInfo.position.size)}</p>
              <p> hedge position effective leverage: {tokenInfo.position.size.div(tokenInfo.position.collateral).toString()}</p>
              <p> hedge position averagePrice: {commifyValue(tokenInfo.position.averagePrice)}</p>
              <p> hedge position collateral: {commifyValue(tokenInfo.position.collateral)}</p>
              <p> hedge position net collateral: {commifyValue(tokenInfo.position.netCollateral)}</p>
              <p> hedge position pnl: {commifyValue(tokenInfo.position.pnl)}</p>
              <p> hedge position net pnl: {commifyValue(tokenInfo.position.netPnl)}</p>
              <p> hedge position net value: {commifyValue(tokenInfo.position.netValue)}</p>
              <p> hedge position funding fee: {commifyValue(tokenInfo.position.fundingFee.mul(-1))}</p>
              <p> hedge position funding fee debt: {commifyValue(tokenInfo.position.fundingFeeDebt.mul(-1))}</p>
              <p> hedge position borrowing fee: {commifyValue(tokenInfo.position.borrowingFee)}</p>
              {/*<p> hedge position delta: {formatPositionDelta(tokenInfo.positionDelta)}</p>*/}
            </Card>
          ))}
        </div>}
      </div>
    </main>
  )
}
