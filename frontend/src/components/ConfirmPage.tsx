import { useState } from 'react';
import { Layout, Card, Typography, Row, Col, Button, Space, Input, List, Divider, message, Tag, Modal } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { confirmData } from '../api';
import type { Event, Annotation, Development, ExtractedRelation } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const MORANDI_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8'];

interface ConfirmPageProps {
  onComplete?: () => void;
  isUpdatingExisting?: boolean;
  existingPersonId?: number;
}

export function ConfirmPage({ onComplete, isUpdatingExisting: initialIsUpdatingExisting, existingPersonId: initialExistingPersonId }: ConfirmPageProps) {
  const { extractedData, originalText, persons, setExtractedData, fetchPersons, isComparedData } = useAppStore();
  const [profile, setProfile] = useState(extractedData?.profile);
  const [annotations, setAnnotations] = useState<Annotation[]>(extractedData?.annotations || []);
  const [developments, setDevelopments] = useState<Development[]>(extractedData?.developments || []);
  const [relations, setRelations] = useState<ExtractedRelation[]>(extractedData?.relations || []);
  const [loading, setLoading] = useState(false);
  const [isNewPerson, setIsNewPerson] = useState(!initialIsUpdatingExisting);
  const [existingPersonId, setExistingPersonId] = useState<number | undefined>(initialExistingPersonId);

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
          events: profile.events,
          notes: profile.notes || []
        },
        annotations,
        developments,
        relations,
      });
      
      message.success('保存成功');
      await fetchPersons();
      setExtractedData(null);
      onComplete?.();
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
          setExistingPersonId(undefined);
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

  const handleEditNote = (index: number, value: string) => {
    const newNotes = [...(profile.notes || [])];
    newNotes[index] = value;
    setProfile({ ...profile, notes: newNotes });
  };

  const handleDeleteNote = (index: number) => {
    const newNotes = (profile.notes || []).filter((_, i) => i !== index);
    setProfile({ ...profile, notes: newNotes });
  };

  const handleAddNote = () => {
    const newNotes = [...(profile.notes || []), ''];
    setProfile({ ...profile, notes: newNotes });
  };

  return (
    <Layout style={{ minHeight: 'auto', background: '#F7F6F1' }}>
      <Content style={{ padding: '16px', maxWidth: '1000px', margin: '0 auto' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {isComparedData && (
            <Card
              style={{
                borderRadius: '8px',
                border: `2px solid ${MORANDI_COLORS[0]}`,
                background: '#F7F6F1',
              }}
            >
              <Text style={{ color: MORANDI_COLORS[0], fontWeight: 'bold' }}>
                以下是新增或冲突的信息，请确认：
              </Text>
            </Card>
          )}
          <Title level={3} style={{ margin: 0, color: MORANDI_COLORS[0], fontSize: 18 }}>
            确认信息
          </Title>

          <Card
            size="small"
            style={{
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: 'none'
            }}
          >
            <Title level={5} style={{ color: MORANDI_COLORS[2], marginBottom: '8px', fontSize: 14 }}>
              原始输入
            </Title>
            <Paragraph style={{ background: '#F7F6F1', padding: '12px', borderRadius: '6px', margin: 0, fontSize: 13 }}>
              {originalText}
            </Paragraph>
          </Card>

          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Card
                size="small"
                title={<span style={{ color: MORANDI_COLORS[0], fontSize: 14 }}>档案信息</span>}
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: 'none'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div>
                    <Text strong style={{ color: '#666', fontSize: 13 }}>姓名</Text>
                    <Input
                      size="small"
                      value={profile.name}
                      onChange={(e) => {
                        setProfile({ ...profile, name: e.target.value });
                      }}
                      onBlur={handleNameCheck}
                      style={{ marginTop: '4px' }}
                      prefix={sameNamePerson && <Tag color="warning" style={{ fontSize: 11 }}>同名</Tag>}
                    />
                  </div>
                  <div>
                    <Text strong style={{ color: '#666', fontSize: 13 }}>职业</Text>
                    <Input
                      size="small"
                      value={profile.job || ''}
                      onChange={(e) => setProfile({ ...profile, job: e.target.value })}
                      style={{ marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <Text strong style={{ color: '#666', fontSize: 13 }}>生日</Text>
                    <Input
                      size="small"
                      value={profile.birthday || ''}
                      onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                      placeholder="MM-DD"
                      style={{ marginTop: '4px' }}
                    />
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Text strong style={{ color: '#666', fontSize: 13 }}>事件</Text>
                      <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={handleAddEvent}
                        style={{ color: MORANDI_COLORS[0] }}
                      />
                    </div>
                    {(() => {
                      const groups: Record<string, { index: number; event: Event }[]> = {};
                      profile.events.forEach((event, idx) => {
                        const key = event.date || `no-date-${idx}`;
                        if (!groups[key]) {
                          groups[key] = [];
                        }
                        groups[key].push({ index: idx, event });
                      });
                      
                      if (Object.keys(groups).length === 0) {
                        return null;
                      }
                      
                      return Object.entries(groups).map(([date, items]) => {
                        const locations = [...new Set(items.map(i => i.event.location).filter(Boolean))];
                        return (
                          <Card
                            key={date}
                            size="small"
                            style={{
                              marginBottom: '8px',
                              borderRadius: '8px',
                              background: '#F7F6F1',
                              border: 'none'
                            }}
                          >
                            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <Tag color={MORANDI_COLORS[0]} style={{ fontSize: '11px', margin: 0 }}>
                                {date.startsWith('no-date-') ? '无日期' : date}
                              </Tag>
                              {locations.map((loc, locIdx) => (
                                <Tag key={locIdx} color={MORANDI_COLORS[2]} style={{ fontSize: '11px', margin: 0 }}>
                                  {loc}
                                </Tag>
                              ))}
                            </div>
                            {items.map(({ index, event }) => (
                              <div key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Space direction="vertical" style={{ flex: 1 }} size="small">
                                  <Input
                                    size="small"
                                    value={event.date}
                                    onChange={(e) => handleEditEvent(index, 'date', e.target.value)}
                                    placeholder="日期"
                                  />
                                  <Input
                                    size="small"
                                    value={event.description}
                                    onChange={(e) => handleEditEvent(index, 'description', e.target.value)}
                                    placeholder="描述"
                                  />
                                  <Input
                                    size="small"
                                    value={event.location || ''}
                                    onChange={(e) => handleEditEvent(index, 'location', e.target.value)}
                                    placeholder="地点（可选）"
                                  />
                                </Space>
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteEvent(index)}
                                />
                              </div>
                            ))}
                          </Card>
                        );
                      });
                    })()}
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Text strong style={{ color: '#666', fontSize: 13 }}>其它信息</Text>
                      <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={handleAddNote}
                        style={{ color: MORANDI_COLORS[0] }}
                      />
                    </div>
                    <List
                      size="small"
                      dataSource={profile.notes || []}
                      renderItem={(note, index) => (
                        <List.Item
                          actions={[
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteNote(index)}
                            />
                          ]}
                        >
                          <Input
                            size="small"
                            value={note}
                            onChange={(e) => handleEditNote(index, e.target.value)}
                            placeholder="如：对海鲜过敏、爱吃榴莲、深圳中学"
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                size="small"
                title={<span style={{ color: MORANDI_COLORS[1], fontSize: 14 }}>标注信息</span>}
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAddAnnotation}
                    style={{ color: MORANDI_COLORS[1] }}
                  />
                </div>
                <List
                  size="small"
                  dataSource={annotations}
                  renderItem={(ann, index) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteAnnotation(index)}
                        />
                      ]}
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Input
                          size="small"
                          value={ann.time}
                          onChange={(e) => handleEditAnnotation(index, 'time', e.target.value)}
                          placeholder="时间"
                        />
                        <Input
                          size="small"
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
                size="small"
                title={<span style={{ color: MORANDI_COLORS[4], fontSize: 14 }}>发展方向</span>}
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAddDevelopment}
                    style={{ color: MORANDI_COLORS[4] }}
                  />
                </div>
                <List
                  size="small"
                  dataSource={developments}
                  renderItem={(dev, index) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteDevelopment(index)}
                        />
                      ]}
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Input
                          size="small"
                          value={dev.content}
                          onChange={(e) => handleEditDevelopment(index, 'content', e.target.value)}
                          placeholder="内容"
                        />
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          <Card
            size="small"
            title={<span style={{ color: MORANDI_COLORS[3], fontSize: 14 }}>人物关系</span>}
            style={{
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleAddRelation}
                style={{ color: MORANDI_COLORS[3] }}
              />
            </div>
            <Row gutter={8}>
              {relations.map((rel, index) => (
                <Col xs={24} sm={8} key={index}>
                  <Card
                    size="small"
                    style={{
                      marginBottom: '8px',
                      borderRadius: '6px',
                      background: '#F7F6F1',
                      border: 'none'
                    }}
                    actions={[
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteRelation(index)}
                      />
                    ]}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <Input
                        size="small"
                        value={rel.name}
                        onChange={(e) => handleEditRelation(index, 'name', e.target.value)}
                        placeholder="姓名"
                      />
                      <Input
                        size="small"
                        value={rel.relation_type}
                        onChange={(e) => handleEditRelation(index, 'relation_type', e.target.value)}
                        placeholder="关系"
                      />
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              type="primary"
              size="middle"
              icon={<SaveOutlined />}
              onClick={handleConfirm}
              loading={loading}
              style={{
                width: '160px',
                height: '40px',
                borderRadius: '6px',
                background: MORANDI_COLORS[0],
                border: 'none'
              }}
            >
              保存
            </Button>
          </div>
        </Space>
      </Content>
    </Layout>
  );
}
