import { useState } from 'react';
import { Layout, Input, Button, Card, Typography, Space, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { extractInfo } from '../api';
import { useAppStore } from '../store';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Content } = Layout;

const MORANDI_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8'];

export function HomePage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { setExtractedData, setOriginalText, setCurrentStep } = useAppStore();

  const handleSubmit = async () => {
    if (!text.trim()) {
      message.warning('请输入关于某人的描述');
      return;
    }

    try {
      setLoading(true);
      const data = await extractInfo(text);
      setExtractedData(data);
      setOriginalText(text);
      setCurrentStep('confirm');
      message.success('信息提取成功');
    } catch (error) {
      message.error('信息提取失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F7F6F1' }}>
      <Content style={{ padding: '48px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={1} style={{ color: MORANDI_COLORS[0], marginBottom: '16px' }}>
            智能人脉管理
          </Title>
          <Text style={{ color: '#666', fontSize: '16px' }}>
            用自然语言描述，让 AI 帮您管理人脉信息
          </Text>
        </div>

        <Card
          style={{
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: 'none'
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={4} style={{ color: MORANDI_COLORS[2], marginBottom: '16px' }}>
                输入信息
              </Title>
              <TextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="例如：今天和张三一起吃饭，他是 AI 工程师，生日是 5 月 20 日，4 月 1 日要去上海出差，对 AI 芯片很感兴趣，他和李四是同事..."
                rows={8}
                style={{ fontSize: '15px', borderRadius: '8px' }}
                maxLength={2000}
                showCount
              />
            </div>

            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={loading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                fontSize: '16px',
                background: MORANDI_COLORS[0],
                border: 'none'
              }}
            >
              提取信息
            </Button>
          </Space>
        </Card>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Text style={{ color: '#999', fontSize: '13px' }}>
            小贴士：您可以输入关于某人的任何信息，AI 会自动提取并结构化
          </Text>
        </div>
      </Content>
    </Layout>
  );
}
