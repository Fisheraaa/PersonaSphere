import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { MainLayout } from './components/MainLayout'
import './App.css'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <MainLayout />
    </ConfigProvider>
  )
}

export default App
