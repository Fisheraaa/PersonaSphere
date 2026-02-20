import { useEffect } from 'react';
import { Card, Typography, Row, Col, Button, Spin, Empty } from 'antd';
import { useAppStore } from '../store';

const { Title } = Typography;

const MORANDI_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8'];

export function CirclesPage() {
  const { circlesWithMembers, loading, fetchCirclesWithMembers } = useAppStore();

  useEffect(() => {
    fetchCirclesWithMembers();
  }, [fetchCirclesWithMembers]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ color: MORANDI_COLORS[0], margin: 0 }}>
          圈子 ({circlesWithMembers.length})
        </Title>
        <div>
          <Button style={{ marginRight: 8 }}>新建圈子</Button>
          <Button>自动生成</Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : circlesWithMembers.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40, borderRadius: 12, border: 'none' }}>
          <Empty
            description="还没有创建任何圈子"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {circlesWithMembers.map((circle) => (
            <Col xs={24} sm={12} md={8} lg={6} key={circle.id}>
              <Card
                style={{
                  marginBottom: 16,
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div>
                  <Title level={5} style={{ margin: 0, marginBottom: 8, color: MORANDI_COLORS[0] }}>
                    {circle.name}
                  </Title>
                  <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                    {circle.members?.length || 0} 位成员
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
