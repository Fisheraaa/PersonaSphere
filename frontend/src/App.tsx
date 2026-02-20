import { useEffect } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { HomePage } from './components/HomePage'
import { ConfirmPage } from './components/ConfirmPage'
import { useAppStore } from './store'
import './App.css'

function App() {
  const { currentStep, fetchPersons } = useAppStore()

  useEffect(() => {
    fetchPersons()
  }, [fetchPersons])

  return (
    <ConfigProvider locale={zhCN}>
      {currentStep === 'input' ? <HomePage /> : <ConfirmPage />}
    </ConfigProvider>
  )
}

export default App
