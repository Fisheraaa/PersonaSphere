import { useEffect } from 'react';
import { Card, Typography, Empty, Spin, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { createCircle } from '../api';

const { Title } = Typography;

const MORANDI_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8'];

export function CirclesPage() {
  const { circles, fetchCircles, loading } = useAppStore();

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  const handleCreateCircle = async () => {
    try {
      const name = `新圈子 ${circles.length + 1}`;
      const color = MORANDI_COLORS[circles.length % MORANDI_COLORS.length];
      await createCircle(name, color);
      await fetchCircles();
    } catch (error) {
      console.error('创建圈子失败:', error);
    }
  };

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: 'none',
      }}
      title={
        <Space>
          <Title level={4} style={{ color: MORANDI_COLORS[0], margin: 0 }}>
            圈子
          </Title>
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={handleCreateCircle}
            style={{ color: MORANDI_COLORS[0] }}
          >
            新建圈子
          </Button>
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : circles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Empty
            description="还没有创建任何圈子"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handleCreateCircle}>
              创建第一个圈子
            </Button>
          </Empty>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ color: '#999' }}>圈子功能组件开发中...</div>
        </div>
      )}
    </Card>
  );
}
