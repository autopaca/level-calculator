// import '@/styles/globals.css'
import type { AppProps } from 'next/app'
// import 'antd/dist/reset.css';
import { ConfigProvider } from 'antd';
export default function App({ Component, pageProps }: AppProps) {
  return <ConfigProvider><Component {...pageProps} /></ConfigProvider>
}
