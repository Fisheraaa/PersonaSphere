import { useState } from 'react';
import { Modal, Typography, Button, Card, Row, Col, Avatar, Input } from 'antd';
import { UserOutlined, CloseOutlined } from '@ant-design/icons';
import type { CheckNameResponse } from '../api';

const { Title, Text } = Typography;

const MORANDI_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8'];

interface NameConflictModalProps {
  visible: boolean;
  existingPerson: CheckNameResponse['person'];
  suggestedName: string;
  onCancel: () => void;
  onUpdate: () => void;
  onCreateNew: (newName: string) => void;
}

export function NameConflictModal({ 
  visible, 
  existingPerson, 
  suggestedName,
  onCancel, 
  onUpdate,
  onCreateNew 
}: NameConflictModalProps) {
  const [newName, setNewName] = useState(suggestedName);

  if (!existingPerson) return null;

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      closeIcon={<CloseOutlined />}
    >
      <Card
        style={{
          borderRadius: 12,
          boxShadow: 'none',
          border: 'none',
        }}
        bodyStyle={{ padding: 8 }}
      >
        <Title level={4} style={{ color: MORANDI_COLORS[0], marginBottom: 24, textAlign: 'center' }}>
          发现同名人物
        </Title>

        <Card
          style={{
            marginBottom: 24,
            borderRadius: 8,
            border: `2px solid ${MORANDI_COLORS[0]}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <Avatar
              size={64}
              icon={<UserOutlined />}
              style={{
                backgroundColor: MORANDI_COLORS[existingPerson.id % MORANDI_COLORS.length],
              }}
            >
              {existingPerson.name.charAt(0)}
            </Avatar>
            <div style={{ marginLeft: 16 }}>
              <Text strong style={{ fontSize: 20, display: 'block', color: MORANDI_COLORS[0] }}>
                {existingPerson.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {existingPerson.job || '暂无职业'}
              </Text>
              {existingPerson.birthday && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                  生日: {existingPerson.birthday}
                </Text>
              )}
            </div>
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Button
              type="primary"
              size="large"
              block
              onClick={onUpdate}
              style={{
                height: 48,
                borderRadius: 8,
                background: MORANDI_COLORS[2],
                border: 'none',
                fontSize: 16,
              }}
            >
              这是同一个人 - 完善信息
            </Button>
          </Col>
          
          <Col xs={24}>
            <Text style={{ display: 'block', marginBottom: 8, color: '#666' }}>
              或者创建新人物（可修改姓名）：
            </Text>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="请输入新姓名"
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
            <Button
              size="large"
              block
              onClick={() => onCreateNew(newName)}
              disabled={!newName.trim()}
              style={{
                height: 48,
                borderRadius: 8,
                borderColor: MORANDI_COLORS[0],
                color: MORANDI_COLORS[0],
                fontSize: 16,
              }}
            >
              这是另一个人 - 创建新档案
            </Button>
          </Col>
        </Row>
      </Card>
    </Modal>
  );
}
