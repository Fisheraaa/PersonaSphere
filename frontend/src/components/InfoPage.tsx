import { useState, useEffect } from 'react';
import { Card, Input, Button, Space, Typography, Row, Col, Avatar, Tag, Empty, Spin, message } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { extractInfo, checkName, compareData } from '../api';
import { useAppStore } from '../store';
import { ConfirmPage } from './ConfirmPage';
import { PersonDetailModal } from './PersonDetailModal';
import { NameConflictModal } from './NameConflictModal';
import type { Person } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const MORANDI_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8'];

export function InfoPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showNameConflict, setShowNameConflict] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [conflictPerson, setConflictPerson] = useState<any>(null);
  const [tempExtractedData, setTempExtractedData] = useState<any>(null);
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const { persons, setExtractedData, setOriginalText, fetchPersons, loading: storeLoading, setIsComparedData } = useAppStore();

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      return;
    }

    try {
      setLoading(true);
      const data = await extractInfo(text);
      
      const nameCheck = await checkName(data.profile.name);
      
      if (nameCheck.exists && nameCheck.person) {
        setConflictPerson(nameCheck.person);
        setTempExtractedData(data);
        
        setShowNameConflict(true);
      } else {
        setIsUpdatingExisting(false);
        setExtractedData(data);
        setOriginalText(text);
        setShowConfirm(true);
      }
    } catch (error) {
      console.error('提取信息失败:', error);
      message.error('提取信息失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleConflictUpdate = async () => {
    try {
      setLoading(true);
      if (tempExtractedData && conflictPerson) {
        const comparedData = await compareData(conflictPerson.id, tempExtractedData);
        setIsUpdatingExisting(true);
        setIsComparedData(true);
        setExtractedData(comparedData);
        setOriginalText(text);
        setShowNameConflict(false);
        setShowConfirm(true);
      }
    } catch (error) {
      console.error('比较数据失败:', error);
      message.error('比较数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleConflictCreateNew = (newName: string) => {
    if (tempExtractedData) {
      const modifiedData = {
        ...tempExtractedData,
        profile: {
          ...tempExtractedData.profile,
          name: newName
        }
      };
      setIsUpdatingExisting(false);
      setExtractedData(modifiedData);
      setOriginalText(text);
    }
    setShowNameConflict(false);
    setShowConfirm(true);
  };

  const handleConflictCancel = () => {
    setShowNameConflict(false);
    setConflictPerson(null);
    setTempExtractedData(null);
  };

  const handleConfirmComplete = () => {
    setShowConfirm(false);
    setText('');
    setIsUpdatingExisting(false);
    setIsComparedData(false);
    setConflictPerson(null);
    setTempExtractedData(null);
    fetchPersons();
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setExtractedData(null);
    setIsUpdatingExisting(false);
    setIsComparedData(false);
    setConflictPerson(null);
    setTempExtractedData(null);
  };

  const handleCardClick = (person: Person) => {
    setSelectedPerson(person);
    setShowDetail(true);
  };

  const handleDetailCancel = () => {
    setShowDetail(false);
    setSelectedPerson(null);
  };

  const handleDetailUpdate = () => {
    fetchPersons();
  };

  const renderPersonCard = (person: Person) => {
    const job = person.profile.job || '暂无职业';
    const birthday = person.profile.birthday || '暂无生日';
    const eventCount = person.events?.length || 0;

    return (
      <Col xs={24} sm={12} md={8} lg={6} key={person.id}>
        <Card
          hoverable
          style={{
            marginBottom: 16,
            borderRadius: 12,
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            cursor: 'pointer',
          }}
          bodyStyle={{ padding: 16 }}
          onClick={() => handleCardClick(person)}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Avatar
              size={48}
              icon={<UserOutlined />}
              style={{
                backgroundColor: MORANDI_COLORS[person.id % MORANDI_COLORS.length],
              }}
            >
              {person.name.charAt(0)}
            </Avatar>
            <div style={{ marginLeft: 12 }}>
              <Text strong style={{ fontSize: 16, display: 'block' }}>
                {person.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {job}
              </Text>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              生日: {birthday}
            </Text>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag color={MORANDI_COLORS[0]} style={{ borderRadius: 6 }}>
              {eventCount} 个事件
            </Tag>
            <Tag color={MORANDI_COLORS[2]} style={{ borderRadius: 6 }}>
              {person.annotations?.length || 0} 个标注
            </Tag>
          </div>
        </Card>
      </Col>
    );
  };

  if (showConfirm) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button
            icon={<UserOutlined />}
            onClick={handleCancelConfirm}
            style={{ border: 'none', color: MORANDI_COLORS[0] }}
          >
            返回信息页面
          </Button>
        </div>
        <ConfirmPage 
          onComplete={handleConfirmComplete}
          isUpdatingExisting={isUpdatingExisting}
          existingPersonId={isUpdatingExisting && conflictPerson ? conflictPerson.id : undefined}
        />
      </div>
    );
  }

  return (
    <>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: 'none',
              maxWidth: 600,
              width: '100%',
            }}
          >
            <Title level={4} style={{ color: MORANDI_COLORS[2], marginBottom: 16, fontSize: 16 }}>
              输入信息
            </Title>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <TextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="例如：今天和张三一起吃饭，他是 AI 工程师..."
                rows={3}
                style={{ fontSize: 14, borderRadius: 8 }}
                maxLength={2000}
                showCount
              />
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={loading}
                disabled={!text.trim()}
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 8,
                  background: MORANDI_COLORS[0],
                  border: 'none',
                }}
              >
                提取信息
              </Button>
            </Space>
          </Card>
        </div>

        <div>
          <Title level={4} style={{ color: MORANDI_COLORS[0], marginBottom: 20 }}>
            已创建的人物 ({persons.length})
          </Title>
          {storeLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : persons.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 40, borderRadius: 12, border: 'none' }}>
              <Empty
                description="还没有创建任何人脉"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {persons.map(renderPersonCard)}
            </Row>
          )}
        </div>
      </Space>
      <PersonDetailModal
        visible={showDetail}
        person={selectedPerson}
        onCancel={handleDetailCancel}
        onUpdate={handleDetailUpdate}
      />
      
      <NameConflictModal
        visible={showNameConflict}
        existingPerson={conflictPerson}
        suggestedName={tempExtractedData?.profile?.name ? 
          (() => {
            const name = tempExtractedData.profile.name;
            let suffix = 2;
            while (persons.some(p => p.name === `${name}(${suffix})`)) {
              suffix++;
            }
            return `${name}(${suffix})`;
          })() : ''}
        onCancel={handleConflictCancel}
        onUpdate={handleConflictUpdate}
        onCreateNew={handleConflictCreateNew}
      />
    </>
  );
}
