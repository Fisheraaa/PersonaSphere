import { useState } from 'react';
import { Layout, Card, Typography, Row, Col, Button, Space, Input, List, Divider, message, Tag, Modal } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { confirmData } from '../api';
import { Event, Annotation, Development, ExtractedRelation } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const MORANDI_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8'];

export function ConfirmPage() {
  const { extractedData, originalText, persons, setCurrentStep, setExtractedData, fetchPersons } = useAppStore();
  const [profile, setProfile] = useState(extractedData?.profile);
  const [annotations, setAnnotations] = useState<Annotation[]>(extractedData?.annotations || []);
  const [developments, setDevelopments] = useState<Development[]>(extractedData?.developments || []);
  const [relations, setRelations] = useState<ExtractedRelation[]>(extractedData?.relations || []);
  const [loading, setLoading] = useState(false);
  const [isNewPerson, setIsNewPerson] = useState(true);
  const [existingPersonId, setExistingPersonId] = useState<number | null>(null);

  if (!extractedData || !profile) {
    return <div>数据错误</div>;
  }

  const sameNamePerson = persons.find(p => p.name === profile.name);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await confirmData({
        original_text: originalText,
        is_new_person: isNewPerson,
        person_id: isNewPerson ? undefined : existingPersonId,
        profile: {
          ...profile,
          events: profile.events
        },
        annotations,
        developments,
        relations,
      });
      
      message.success('保存成功');
      await fetchPersons();
      setCurrentStep('input');
      setExtractedData(null);
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleNameCheck = () => {
    if (sameNamePerson) {
      Modal.confirm({
        title: '检测到同名人物',
        content: `数据库中已存在名为 "${profile.name}" 的人物，请问这是同一个人吗？`,
        okText: '是同一个人，完善信息',
        cancelText: '不是，新建人物',
        onOk: () => {
          setIsNewPerson(false);
          setExistingPersonId(sameNamePerson.id);
        },
        onCancel: () => {
          setIsNewPerson(true);
          setProfile(prev => prev ? { ...prev, name: `${prev.name}(2)` } : prev);
        }
      });
    }
  };

  const handleEditEvent = (index: number, field: keyof Event, value: string) => {
    const newEvents = [...profile.events];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setProfile({ ...profile, events: newEvents });
  };

  const handleDeleteEvent = (index: number) => {
    const newEvents = profile.events.filter((_, i) => i !== index);
    setProfile({ ...profile, events: newEvents });
  };

  const handleAddEvent = () => {
    const newEvents = [...profile.events, { date: '', description: '' }];
    setProfile({ ...profile, events: newEvents });
  };

  const handleEditAnnotation = (index: number, field: keyof Annotation, value: string) => {
    const newAnnotations = [...annotations];
    newAnnotations[index] = { ...newAnnotations[index], [field]: value };
    setAnnotations(newAnnotations);
  };

  const handleDeleteAnnotation = (index: number) => {
    setAnnotations(annotations.filter((_, i) => i !== index));
  };

  const handleAddAnnotation = () => {
    setAnnotations([...annotations, { time: '', description: '' }]);
  };

  const handleEditDevelopment = (index: number, field: keyof Development, value: string) => {
    const newDevelopments = [...developments];
    newDevelopments[index] = { ...newDevelopments[index], [field]: value };
    setDevelopments(newDevelopments);
  };

  const handleDeleteDevelopment = (index: number) => {
    setDevelopments(developments.filter((_, i) => i !== index));
  };

  const handleAddDevelopment = () => {
    setDevelopments([...developments, { content: '', type: 'resource' }]);
  };

  const handleEditRelation = (index: number, field: keyof ExtractedRelation, value: string) => {
    const newRelations = [...relations];
    newRelations[index] = { ...newRelations[index], [field]: value };
    setRelations(newRelations);
  };

  const handleDeleteRelation = (index: number) => {
    setRelations(relations.filter((_, i) => i !== index));
  };

  const handleAddRelation = () => {
    setRelations([...relations, { name: '', relation_type: '' }]);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F7F6F1' }}>
      <Content style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setCurrentStep('input')}
              style={{ border: 'none', color: MORANDI_COLORS[0] }}
            >
              返回
            </Button>
            <Title level={3} style={{ margin: 0, color: MORANDI_COLORS[0] }}>
              确认信息
            </Title>
            <div style={{ width: '80px' }}></div>
          </div>

          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: 'none'
            }}
          >
            <Title level={5} style={{ color: MORANDI_COLORS[2], marginBottom: '12px' }}>
              原始输入
            </Title>
            <Paragraph style={{ background: '#F7F6F1', padding: '16px', borderRadius: '8px', margin: 0 }}>
              {originalText}
            </Paragraph>
          </Card>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Card
                title={
                  <Space>
                    <span style={{ color: MORANDI_COLORS[0] }}>档案信息</span>
                  </Space>
                }
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: 'none'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong style={{ color: '#666' }}>姓名</Text>
                    <Input
                      value={profile.name}
                      onChange={(e) => {
                        setProfile({ ...profile, name: e.target.value });
                      }}
                      onBlur={handleNameCheck}
                      style={{ marginTop: '8px' }}
                      prefix={sameNamePerson && <Tag color="warning">同名</Tag>}
                    />
                  </div>
                  <div>
                    <Text strong style={{ color: '#666' }}>职业</Text>
                    <Input
                      value={profile.job || ''}
                      onChange={(e) => setProfile({ ...profile, job: e.target.value })}
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                  <div>
                    <Text strong style={{ color: '#666' }}>生日</Text>
                    <Input
                      value={profile.birthday || ''}
                      onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                      placeholder="MM-DD 或 YYYY-MM-DD"
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                  <Divider style={{ margin: '16px 0' }} />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <Text strong style={{ color: '#666' }}>事件</Text>
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={handleAddEvent}
                        style={{ color: MORANDI_COLORS[0] }}
                      >
                        添加
                      </Button>
                    </div>
                    <List
                      dataSource={profile.events}
                      renderItem={(event, index) => (
                        <List.Item
                          actions={[
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteEvent(index)}
                            />
                          ]}
                        >
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Input
                              value={event.date}
                              onChange={(e) => handleEditEvent(index, 'date', e.target.value)}
                              placeholder="日期"
                              prefix={<span style={{ color: '#5F7256' }}>📅</span>}
                            />
                            <Input
                              value={event.location || ''}
                              onChange={(e) => handleEditEvent(index, 'location', e.target.value)}
                              placeholder="地点"
                              prefix={<span style={{ color: '#4A7B9C' }}>📍</span>}
                            />
                            <Input
                              value={event.description}
                              onChange={(e) => handleEditEvent(index, 'description', e.target.value)}
                              placeholder="描述"
                            />
                          </Space>
                        </List.Item>
                      )}
                    />
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                title={<span style={{ color: MORANDI_COLORS[1] }}>标注信息</span>}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <Text></Text>
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={handleAddAnnotation}
                    style={{ color: MORANDI_COLORS[1] }}
                  >
                    添加
                  </Button>
                </div>
                <List
                  dataSource={annotations}
                  renderItem={(ann, index) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteAnnotation(index)}
                        />
                      ]}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Input
                          value={ann.time}
                          onChange={(e) => handleEditAnnotation(index, 'time', e.target.value)}
                          placeholder="时间"
                          prefix={<span style={{ color: '#9B6B6B' }}>⏰</span>}
                        />
                        <Input
                          value={ann.location || ''}
                          onChange={(e) => handleEditAnnotation(index, 'location', e.target.value)}
                          placeholder="地点"
                        />
                        <Input
                          value={ann.description}
                          onChange={(e) => handleEditAnnotation(index, 'description', e.target.value)}
                          placeholder="描述"
                        />
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                title={<span style={{ color: MORANDI_COLORS[4] }}>发展方向</span>}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <Text></Text>
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={handleAddDevelopment}
                    style={{ color: MORANDI_COLORS[4] }}
                  >
                    添加
                  </Button>
                </div>
                <List
                  dataSource={developments}
                  renderItem={(dev, index) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteDevelopment(index)}
                        />
                      ]}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Input
                          value={dev.content}
                          onChange={(e) => handleEditDevelopment(index, 'content', e.target.value)}
                          placeholder="内容"
                          prefix={<span style={{ color: '#9251A8' }}>🚀</span>}
                        />
                        <Input
                          value={dev.type}
                          onChange={(e) => handleEditDevelopment(index, 'type', e.target.value)}
                          placeholder="类型"
                        />
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title={<span style={{ color: MORANDI_COLORS[3] }}>人物关系</span>}
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Text></Text>
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={handleAddRelation}
                style={{ color: MORANDI_COLORS[3] }}
              >
                添加关系
              </Button>
            </div>
            <Row gutter={16}>
              {relations.map((rel, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Card
                    size="small"
                    style={{
                      marginBottom: '12px',
                      borderRadius: '8px',
                      background: '#F7F6F1',
                      border: 'none'
                    }}
                    actions={[
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteRelation(index)}
                      />
                    ]}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Input
                        value={rel.name}
                        onChange={(e) => handleEditRelation(index, 'name', e.target.value)}
                        placeholder="姓名"
                      />
                      <Input
                        value={rel.relation_type}
                        onChange={(e) => handleEditRelation(index, 'relation_type', e.target.value)}
                        placeholder="关系类型"
                        prefix={<span style={{ color: '#B5A189' }}>👥</span>}
                      />
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Button
              size="large"
              onClick={() => setCurrentStep('input')}
              style={{ width: '160px', height: '48px', borderRadius: '8px' }}
            >
              取消
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleConfirm}
              loading={loading}
              style={{
                width: '200px',
                height: '48px',
                borderRadius: '8px',
                background: MORANDI_COLORS[0],
                border: 'none'
              }}
            >
              保存信息
            </Button>
          </div>
        </Space>
      </Content>
    </Layout>
  );
}
